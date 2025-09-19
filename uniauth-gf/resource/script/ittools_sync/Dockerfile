FROM python:3.13

RUN pip install --no-cache-dir aiohttp>=3.12.15 asyncpg>=0.30.0

ENV USER_QUERY_URL="https://ittools.cuhk.edu.cn/api/GetUserInfoApi/GetUserList"
ENV QUERY_API_KEYS='["eguyI+ei14o2FZRvkNJ64aY3F1+g2l5SKgkhQslw5Yi9yBWve6AhrAYXHdhRo0wiyBmlK/Yx+WJiRXUtifj2cg==","qrlMuLHFJ5lUYn0dpw8cKQv+4ENRHg52Pf6CzJ0pFsbuLRKFBn12SzDZ0EpET0qxHk+hLAY5z3pzbKlSbYNlQA==","FxEaIJQAwjrOwBK9yEfR7PHr0BGnQkbFBjV9o2ITn7hSR/MIVoWZFvgF+1KZxAxWnSDDUVcNjRtcAxTQAG2Miw==","wVyCOz+L0S+4gThtiyNmAWEGIzn5Sx95sisPPZOjLN2Pvo+WWrlNrE9fgl40zhBg9fIzUg7hg2x2AQOT0+fZ3g=="]'
ENV ENCRYPT_PASSWORD="KtlsFOANel7N4RWngyMWXZEzb6IMlPh008qbrYipCGnXtBIbdU0i8UWRHQ1TRyTKJ7glUvEmFu9+y98L00WJDW8vceMUX714iXXWmUIRjI2hg8qcIaIq1v2XDlnxOjsluCh6j3kbVM5q/6NtSVgIhajHJ8qa80GH9sBnjJphx8VTfH/Zr+kUfMPmNa+MLIRoPmxR8HetSiLFSymAXISjIlzCLKc6oxUuHABFU9TGqKA+ElAmVTwpamgk/cK506fwShlbEdhX1xOhMyY3EUCyMUX/efnBwK9apcg1xPoGzUdK40czlOyqGh1EIYuOI61k/FI8YM3H1iFitfV1U1AYYQ=="
ENV PGHOST="host.docker.internal"
ENV PGUSER="uniauth"
ENV PGPASSWORD="It@73333!"
ENV PGDATABASE="uniauth"

WORKDIR /app
RUN chmod 777 /app
COPY sync.py /app/sync.py

CMD ["python3", "sync.py"]