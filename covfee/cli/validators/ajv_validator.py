import os
import json
import subprocess
import collections

from jsonschema import Draft7Validator
from jsonschema.exceptions import ValidationError as JsonValidationError

from .validation_errors import ValidationError
import zmq
context = zmq.Context()

class AjvValidator:

    def __init__(self):
        #  Socket to talk to server
        self.socket = context.socket(zmq.REQ)
        # bind to a random port in loopback iface
        port = self.socket.bind_to_random_port("tcp://127.0.0.1")

        # start the nodejs validation server in the same interface
        self.process = subprocess.Popen(["node", os.path.join(os.path.dirname(os.path.realpath(__file__)), 'ajv_validator.js'), "serve", str(port)])

    def __del__(self):
        # pass
        self.process.kill()

    @staticmethod
    def parse_ajv_path(ajv_instance_path):
        if ajv_instance_path == '/': return ''

        parts = ajv_instance_path.split('/')[1::2]
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
        if not result['valid']:
            err = result['errors'][0]
            raise ValidationError(
                message=self.get_friendly_error_message(err),
                path=AjvValidator.parse_ajv_path(err['instancePath']),
                instance=err['data']
            )

    def validate_project(self, project_spec):
        self.schema_validate('ProjectSpec', project_spec)

    def validate_hit(self, hit_spec):
        self.schema_validate('HitSpec', hit_spec)

    def validate_task(self, task_spec):
        self.schema_validate('TaskSpec', task_spec)
