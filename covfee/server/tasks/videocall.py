import requests
from flask import current_app as app

from covfee.logger import logger

from .base import BaseCovfeeTask, CriticalError

OPENVIDU_URL = "http://192.168.0.22:4443/"
OPENVIDU_SECRET = "MY_SECRET"


class VideocallTask(BaseCovfeeTask):
    def _request_session_id(self):
        # https://openvidu.discourse.group/t/session-lifecycle/103/2

        recordingOptions = self.task.spec.spec["serverRecording"]
        if recordingOptions is None:
            recordingOptions = {}

        try:
            response = requests.post(
                OPENVIDU_URL + "openvidu/api/sessions",
                verify=False,
                auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                headers={"Content-type": "application/json"},
                json={
                    "mediaMode": "ROUTED",
                    "recordingMode": "ALWAYS",
                    "defaultRecordingProperties": {**recordingOptions},
                    "customSessionId": str(self.task.id),
                },
                timeout=2,
            )
            response.raise_for_status()
            return response.json()["sessionId"]
        except requests.exceptions.HTTPError as err:
            if err.response.status_code == 409:
                # Session already exists in OpenVidu
                app.logger.warn(
                    f"_request_session_id called but session already exists for session_id {str(self.task.id)}"
                )
                return str(self.task.id)
            else:
                raise err

    def _request_connection_token(self, session_id, journey_id):
        response = requests.post(
            OPENVIDU_URL + "openvidu/api/sessions/" + session_id + "/connection",
            verify=False,
            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
            headers={"Content-type": "application/json"},
            json={"data": journey_id},
            timeout=2,
        )
        response.raise_for_status()
        return response.json()["token"]

    def on_start(self):
        logger.info("VideocallTask:on_start")
        # start recording

        # response = requests.post(
        #     OPENVIDU_URL + "openvidu/api/recordings/start",
        #     verify=False,
        #     auth=("OPENVIDUAPP", OPENVIDU_SECRET),
        #     headers={"Content-type": "application/json"},
        #     json={"session": str(self.task.id), **recordingOptions},
        #     timeout=2,
        # )
        # response.raise_for_status()

    def on_join(self, journey=None):
        logger.info("VideocallTask:on_join")
        # retrieve or request a session ID for the call / room

        try:
            session_id = self._request_session_id()
            connection_token = self._request_connection_token(
                session_id, journey.id.hex() if journey is not None else None
            )
        except Exception:
            raise CriticalError(load_task=True)

        return {"session_id": session_id, "connection_token": connection_token}
