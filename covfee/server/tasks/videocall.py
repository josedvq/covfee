import os
import time
import signal
import subprocess

from flask import current_app as app
from ..orm import db

from .base import BaseCovfeeTask
from ..utils.agora.rtc_token_builder import RtcTokenBuilder, Role_Attendee

class VideocallTask(BaseCovfeeTask):
    def get_task_specific_props(self) -> dict:

        if 'AGORA_APPID' not in app.config or 'AGORA_CERT' not in app.config:
            return {}

        # token valid for 10 hours
        privilegeExpiredTs = int(time.time()) + 10*60*60 # in seconds
        return {
            'agoraAppId': app.config['AGORA_APPID'],
            'agoraToken': RtcTokenBuilder.buildTokenWithUid(app.config['AGORA_APPID'], app.config['AGORA_CERT'], str(self.task.id), 0, Role_Attendee, privilegeExpiredTs)
        }

    def on_first_join(self):
        ''' Starts the recording script
        '''
        recording_dir = os.path.join(app.config["PROJECT_WWW_PATH"], self.task.hitinstance.id.hex(), f'{self.task.id}_{str(self.response.id)}')
        if not os.path.exists(recording_dir):
            os.makedirs(recording_dir)

        cmd =  [f'{app.config["AGORA_RECORDER_PATH"]}',
                f' --appId {app.config["AGORA_APPID"]}',
                f' --channel {self.response.id}',
                f' --recordFileRootDir {recording_dir}',
                f' --triggerMode 1',
                f' --uid 0',
                f' --channelProfile 0',
                f' --appliteDir {app.config["AGORA_APPLITEDIR"]}']

        p = subprocess.Popen(cmd)
        print(' '.join(cmd))
        self.response.extra['recorder_pid'] = p.pid
        db.session.commit()
        # os.system(f'kill -s 10 {p.pid}')
        os.kill(p.pid, 10)


    def on_last_leave(self):
        ''' Stops the recording script
        '''
        if 'recorder_pid' in self.response.extra:
            os.kill(self.response.extra['recorder_pid'], 12)
            del self.response.extra['recorder_pid']
            db.session.commit()

