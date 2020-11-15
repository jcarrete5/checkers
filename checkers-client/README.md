# checkers-client
The checkers client source code.

## Development
Make sure the following prerequisite applications are installed
- [nodejs](https://nodejs.org/en/)
- [yarn](https://classic.yarnpkg.com/en/docs/install)

Open a terminal and navigate to the `checkers-client/` directory

    cd /path/to/checkers-client

Install dependencies

    yarn
    
Start the development server

    yarn start
    
### Making changes
Before working on a requirement, create a new branch to work on

    git switch -c req/REQID

Where `REQID` is the requirement ID

After making your changes to the code, commit and push your changes

    git add -A
    git commit -m 'YOUR_MESSAGE'
    git push
 
You may need to specify a remote tracking branch for git push.
Run the following command instead of `git push`. On subsequent
pushes, you won't need to specify the branch you are pushing.
 
    git push -u origin BRANCHNAME
    
Where `BRANCHNAME` is the name of the branch you are pushing i.e.
`req/REQID`.

If you are ready to merge your changes, create a pull request for your
branch on GitHub.
