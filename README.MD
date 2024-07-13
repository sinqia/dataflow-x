project-root/
│
├── config/
│   └── config.js
│
├── controllers/
│   └── sqlController.js
│   └── bigQueryController.js
│
├── models/
│   └── sqlModel.js
│
├── routes/
│   └── index.js
│
├── services/
│   └── schemaService.js
│   └── bigQueryService.js
│
├── utils/
│   └── typeMapping.js
│
├── .env
├── app.js
└── package.json


# docker
docker build -t dataflow-x .
docker-compose up
or
docker-compose up --build
docker-compose down
docker stop <nome-do-container>
docker rm <nome-do-container>
docker exec -it dataflow-x-app-1 sh
docker ps -a
git config credential.username username1

