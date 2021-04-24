DROP TABLE IF EXISTS table1;

CREATE TABLE table1(
    id SERIAL PRIMARY KEY,
    country VARCHAR(255),
    confirmed VARCHAR(255),
    recovered VARCHAR(255),
    deaths VARCHAR (255),
    date VARCHAR(255)

);