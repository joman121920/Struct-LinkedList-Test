set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate


if [[ $CREATE_SUPERUSER ]]
then
    python manage.py createsuperuser --no-input
fi

# #!/bin/bash
# set -o errexit
# # Install dependencies
# pip install -r requirements.txt

# # Move into backend folder
# cd Struct 

# # Django setup
# python manage.py collectstatic --no-input
# python manage.py migrate
