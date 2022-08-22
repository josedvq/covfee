class Maker():
    def _make(file_or_folder, force=False, rms=False, stdout_enabled=True):
    
        project_folder = CovfeeFolder(os.getcwd())

        # add the covfee files to the project
        with Halo(text='Adding .covfee.json files', spinner='dots', enabled=stdout_enabled) as spinner:
            covfee_files = project_folder.add_covfee_files(file_or_folder)

            if len(covfee_files) == 0:
                err = f'No valid covfee files found. Make sure that {file_or_folder} points to a file or to a folder containing .covfee.json files.'
                spinner.fail(err)
                raise FileNotFoundError(err)

            spinner.succeed(f'{len(covfee_files)} covfee project files found.')

        # validate the covfee files
        schema = Schemata()
        if rms or not schema.exists():
            schema.make()
        
        project_folder.validate(with_spinner=stdout_enabled)

        # init project folder if necessary
        if not project_folder.is_project():
            project_folder.init()
        project_folder.push_projects(force=force, with_spinner=stdout_enabled)

        # link bundles
        with Halo(text='Linking covfee bundles', spinner='dots', enabled=stdout_enabled) as spinner:
            try:
                project_folder.link_bundles()
            except Exception as e:
                spinner.fail('Error linking bundles. Aborted.')
                raise e
            spinner.succeed('covfee bundles linked.')