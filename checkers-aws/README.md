checkers-aws
============
AWS backend functions for the checkers application

Prequisites
-----------
- Python ~3.8

Setup
-----
Start by creating a virtual environment to install dependencies to

    python3 -m venv .venv/

Activate the virtual environment

    . .venv/bin/activate

Install dependencies

    pip install -r requirements.txt

Now your environment should be set up for development

Deploy
------
Run the deploy script to zip and deploy the lambda functions

    ./deploy

*A properly configured aws-cli is required to run the deploy script*
