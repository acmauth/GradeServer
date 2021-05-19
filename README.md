## Setup Guide for Server

1. Install docker following the instructions at https://gist.github.com/din0s/2660fdf6cf2307737210b62770780157
2. Clone repository
3. Open a terminal and a file exlorer in \GradeServer 
4. At terminal input **cp .env.defaults .env** 
5. In .env file change *mongoHost=ip:port* to *mongoHost=0.0.0.0:27017*
6. At terminal input (docker must be running):
>* npm install
>* docker-compose up -d mongodb
>* npm start