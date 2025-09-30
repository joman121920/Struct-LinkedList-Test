# set -o errexit

# pip install -r requirements.txt

# python manage.py collectstatic --no-input

# python manage.py migrate

#!/bin/bash
set -o errexit

# Move into backend folder
cd Struct/backend

# Install dependencies
pip install -r requirements.txt

# Django setup
python manage.py collectstatic --no-input
python manage.py migrate
