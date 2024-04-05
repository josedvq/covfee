1. Copy or link `covfee_nginx.config` to /etc/nginx/sites-available and then make a link to it in sites-enabled

2. Comment out the following section in the /etc/nginx/sites-available/default

    ```
    location / {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        try_files $uri $uri/ =404;
    }
    ```

3. Restart nginx `sudo systemctl restart nginx`

4. Follow the instructions in [https://josedvq.github.io/covfee/docs/deployment](https://josedvq.github.io/covfee/docs/deployment)
    * Change the passwords in `covfee.deployment.config.py`
    * Create the covfee database and data bundles
        ```
        covfee-dev schemata
        covfee-dev build
        covfee make continuous_annotation.py --no-launch --deploy
        ```
    * Serve the app with gunicorn using systemd (not sure if we can use 4 workers instead of 1 in gunicorn)
        * This instructions were adapted from [serve flask with gunicorn and nginx](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-ubuntu-18-04)
        * Copy or link `covfee.service` to /etc/systemd/system/
        * Start the service that serves covfee `sudo systemctl start covfee`
5. Visit the admin panel in [https://covfee.ewi.tudelft.nl/covfee/admin](https://covfee.ewi.tudelft.nl/covfee/admin)