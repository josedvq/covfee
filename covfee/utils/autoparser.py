import argparse
import inspect

def subparser(f):
    f.subparser = True
    return f

def create_subparser_from_func(subparsers, f):
    parser = subparsers.add_parser(f.__name__)

    signature = inspect.signature(f)
    for name, det in signature.parameters.items():
        dtype = det.annotation
        if dtype == inspect.Parameter.empty:
            dtype = None

        default = det.default
        if default == inspect.Parameter.empty:
            default = None

        required = default is None

        parser.add_argument('--'+name, required=required,
                            default=default, type=dtype)
    return parser

def test_parser(glob):
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='command')

    for key, value in glob.items():
        if hasattr(value, 'subparser') and value.subparser:

            # decorated function, expose in a subparser
            create_subparser_from_func(subparsers, value)

    
    args = vars(parser.parse_args())
    func = glob[args['command']]
    del args['command']
    func(**args)