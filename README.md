# arXiv Analytics
- Insights on research papers from arXiv based on specific keyword
- ArXiv API - https://arxiv.org/help/api/user-manual

- Deploying as .zip to AWS Lambda:
    - create lambda_function.py and requirements.txt
    - $ pip3 install --target ./package -r requirements.txt
    - $ cd package
    - $ zip -r ../arxiv-analytics-deployment-package.zip .
    - $ cd ..
    - $ zip -g arxiv-analytics-deployment-package.zip lambda_function.py

- AWS CLI commands
    - aws s3 cp ./website/index.html s3://arxiv-analytics
    - aws s3 cp ./lambda_function/arxiv-analytics-deployment-package.zip s3://arxiv-analytics-helper/deployment_package/
    - aws lambda update-function-code --function-name arxiv-analytics --s3-bucket arxiv-analytics-helper --s3-key deployment_package/arxiv-analytics-deployment-package.zip