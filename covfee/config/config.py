import os
import flask
from urllib.parse import urlparse


class Config(flask.Config):
    """
    Like a dict, but provides methods to load local, dev or prod configs
    """

    def __init__(self, mode: str = None):
        super().__init__("/")
        self.from_object("covfee.config.defaults")
        if mode is not None:
            self.load_environment(mode)

    def load_environment(self, mode: str):
        # config = flask.Config('/')
        self["COVFEE_ENV"] = mode
        # load the base configuration object

        # update with the custom project config files
        if mode == "local":
            self.from_pyfile(
                os.path.join(os.getcwd(), "covfee.local.config.py"), silent=True
            )
        elif mode == "dev":
            self.from_pyfile(
                os.path.join(os.getcwd(), "covfee.development.config.py"), silent=True
            )
        elif mode == "deploy":
            self.from_pyfile(
                os.path.join(os.getcwd(), "covfee.deployment.config.py"), silent=True
            )
        else:
            raise Exception(f"Unrecognized application mode {mode}.")

        # check if SSL enabled
        self["SSL_ENABLED"] = "SSL_KEY_FILE" in self and "SSL_CERT_FILE" in self

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
            if self["COVFEE_ENV"] in ["local", "deploy"]
            else "development",
            "socketio_enabled": self["SOCKETIO_ENABLED"],
            "google_client_id": self["GOOGLE_CLIENT_ID"],
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
