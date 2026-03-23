FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY deploy/nginx-docker.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

EXPOSE 80
