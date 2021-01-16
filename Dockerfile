FROM python:3.6
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
# RUN pip install gunicorn 
EXPOSE 5000
# CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:server"]
ENTRYPOINT [ "python" ] 
CMD ["app.py"]
