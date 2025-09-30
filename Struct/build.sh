#!/bin/bash
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Go to folder where manage.py is
cd Struct


# # Django setup2
python manage.py migrate

