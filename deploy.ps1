Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned

& "d:\zhehaya blog\.venv\Scripts\Activate.ps1"


function Commit-IfNeeded($message) {
    git add .

    if (git diff --cached --quiet) {
        Write-Host "没有修改，跳过提交"
    }
    else {
        git commit -m $message
    }
}


Write-Host "===== 第一次提交 ====="
Commit-IfNeeded "before mkdocs gh-deploy"


Write-Host "===== MkDocs 部署 ====="
mkdocs gh-deploy


Write-Host "===== 第二次提交 ====="
Commit-IfNeeded "after mkdocs gh-deploy"


Write-Host "===== Push ====="
git push origin $(git branch --show-current)


Write-Host "===== 完成 ====="