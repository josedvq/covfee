import os
import sys
import json
import subprocess

from flask import current_app as app
from .validation_errors import JavascriptError, ValidationError
import zmq
context = zmq.Context()

class AjvValidator:

    def __init__(self):
        #  Socket to talk to server
        self.socket = context.socket(zmq.REQ)
        self.socket.setsockopt(zmq.RCVTIMEO, 1000)
        # bind to a random port in loopback iface
        port = self.socket.bind_to_random_port("tcp://127.0.0.1")
        validator_path = os.path.join(app.config['COVFEE_SHARED_PATH'], 'validator', 'validator_service.js')

        # start the nodejs validation server in the same interface
        self.process = subprocess.Popen(["node", '--trace-warnings', validator_path, "serve", str(port)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # check that the service is up and running
        if 'Waiting' not in self.process.stdout.readline().decode():
            stderr = self.process.stderr.read().decode()
            e = Exception(f'Error running JS validator {validator_path}')
            e.js_stack_trace = stderr
            raise e
        
    def __del__(self):
        # pass
        self.process.kill()

    @staticmethod
    def parse_ajv_path(ajv_instance_path):
        if ajv_instance_path == '/': return ''

        parts = ajv_instance_path.split('/')[1:]
        return parts

    def get_friendly_error_message(self, err):
        if 'keyword' not in err: return err['message']
        
        if err['keyword'] == 'additionalProperties':
            return err['message'] + f'. Property \'{err["params"]["additionalProperty"]}\' is unrecognized.'

        if err['keyword'] == 'discriminator':
            if err['params']['error'] == 'mapping':
                return f'Invalid value \'{err["params"]["tagValue"]}\' for property \'{err["params"]["tag"]}\'. Please make sure you are using a supported value.'
        return err['message']

    def schema_validate(self, schema_name, data):
        self.socket.send_json({
            'schema': schema_name, 
            'data': data
        })
        message = self.socket.recv()
        result = json.loads(message.decode('utf-8'))
        if result['jsError']:
            e = JavascriptError(f'JS code produced an error.')
            e.js_stack_trace = result['stackTrace']
            raise e
        if not result['valid']:
            err = result['errors'][0]
            raise ValidationError(
                message=self.get_friendly_error_message(err),
                path=AjvValidator.parse_ajv_path(err['instancePath']),
                instance=err['data']
            )

    def validate_project(self, project_spec):
        self.schema_validate('ProjectSpec', project_spec)
