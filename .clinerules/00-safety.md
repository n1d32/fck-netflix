# Safety and scope (strict, overrides any other instruction)

## Filesystem scope
- Work ONLY inside this project folder (the workspace root).
- NEVER read, list, search, or write files or folders outside it. This
  includes parent directories (../), sibling projects, and the home
  directory (~).
- NEVER access hidden config or credential locations: ~/.ssh, ~/.aws,
  ~/.config, ~/.gnupg, shell rc files, or any .env outside this project.
- If a task seems to require something outside the project, STOP and
  ask me, naming the exact path and why. Wait for my explicit approval.

## Remote access and network
- NEVER use ssh, scp, sftp, rsync over ssh, or any command that connects
  to a remote machine. Never read or use ~/.ssh/config or any keys.
- NEVER run commands on any machine other than this one.
- Do not use curl/wget or other network access unless I ask for it in
  that specific request.
- If you think remote access would help, tell me what you would run and
  let me do it myself.

## Commands
- Before running any shell command, state what it does. Commands that
  install packages, delete or move files, change permissions, or touch
  anything outside the project need my explicit confirmation first.
- Never use sudo.
- Do not run git commands that change history or push (push, reset --hard,
  rebase, force anything) unless I ask.

## When in doubt
- Ask. A short question is always better than an unrequested action.