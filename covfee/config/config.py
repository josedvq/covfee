import os
from urllib.parse import urlparse

import flask


class Config(flask.Config):
    """
    Like a dict, but provides methods to load dev or deploy configs.
    """

    def __init__(self, mode: str = None, host=None, port=None):
        super().__init__("/")
        self.from_object("covfee.config.defaults")
        self._loaded_config_keys = set()
        if mode is not None:
            self.load_environment(mode, host, port)

    def _get_optional_string(self, key: str) -> str | None:
        value = self.get(key)
        if isinstance(value, str):
            value = value.strip()
        return value or None

    def load_environment(self, mode: str, host=None, port=None):
        for key in self._loaded_config_keys:
            self.pop(key, None)
        self._loaded_config_keys = set()
        self.from_object("covfee.config.defaults")
        self["COVFEE_ENV"] = mode
        self.from_prefixed_env(prefix="COVFEE")
        self._loaded_config_keys = {
            key[len("COVFEE_"):]
            for key in os.environ
            if key.startswith("COVFEE_")
        }

        ssl_key_file = self._get_optional_string("SSL_KEY_FILE")
        ssl_cert_file = self._get_optional_string("SSL_CERT_FILE")
        if ssl_key_file is None:
            self.pop("SSL_KEY_FILE", None)
        else:
            self["SSL_KEY_FILE"] = ssl_key_file
        if ssl_cert_file is None:
            self.pop("SSL_CERT_FILE", None)
        else:
            self["SSL_CERT_FILE"] = ssl_cert_file

        # Enable SSL only when both configured file paths are non-empty.
        ssl_enabled = ssl_key_file is not None and ssl_cert_file is not None

        host = host or self.get("HOST", "localhost")
        port = port or self.get("PORT", 5001)
        

        # make the base urlparse
        self['BASE_URL'] = f"http{'s' if ssl_enabled else ''}://{host}:{port}"
        self['SSL_ENABLED'] = ssl_enabled

        # apply extended config
        app_path = urlparse(self["BASE_URL"]).path
        if app_path == "":
            app_path = "/"

        self.update(
            # copy over secret key
            JWT_SECRET_KEY=self["COVFEE_SECRET_KEY"],
            # create sqlalchemy database uri
            SQLALCHEMY_DATABASE_URI=f'sqlite:///{self["DATABASE_PATH"]}',
            # create derived URLs
            BUNDLES_URL=self["BASE_URL"] + "/bundles",
            PROJECT_WWW_URL=self.get("PROJECT_WWW_URL", self["BASE_URL"] + "/www"),
            APP_URL=self["BASE_URL"] + "/#",
            ADMIN_URL=self["BASE_URL"] + "/admin#",
            LOGIN_URL=self["BASE_URL"] + "/admin#login",
            API_URL=self["BASE_URL"] + "/api",
            AUTH_URL=self["BASE_URL"] + "/auth",
            # Set the cookie paths, so that you are only sending your access token
            # cookie to the access endpoints, and only sending your refresh token
            # to the refresh endpoint. Technically this is optional, but it is in
            # your best interest to not send additional cookies in the request if
            # they aren't needed.
            JWT_ACCESS_COOKIE_PATH=app_path,
            JWT_REFRESH_COOKIE_PATH=os.path.join(app_path, "auth/refresh"),
        )

        # point to webpack-dev-server bundles in dev mode
        if mode == "dev":
            self["BUNDLES_URL"] = self["DEV_BUNDLES_URL"]

    def get_frontend_config(self):
        # create the frontend config object:
        return {
            # frontend only has two environments: production and development
            "env": "production"
            if self["COVFEE_ENV"] == 'deploy'
            else "development",
            "www_url": self["PROJECT_WWW_URL"],
            "app_url": self["APP_URL"],
            "base_url": self["BASE_URL"],
            "api_url": self["API_URL"],
            "auth_url": self["AUTH_URL"],
            "admin": {
                "unsafe_mode_on": self.get("UNSAFE_MODE_ON", False),
                "home_url": self["ADMIN_URL"],
                "login_url": self["LOGIN_URL"],
            },
        }


config = Config()
# def load_config(app, mode: str):
#     config = get_config(mode)
#     app.config.update(config)
