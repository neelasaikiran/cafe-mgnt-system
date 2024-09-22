create table user(
    id int primary key auto_increment,
    NAME varchar(250),
    contactNumber varchar(20),
    email varchar(50),
    password varchar(250),
    status varchar(20),
    role varchar(20),
    unique (email) 
);

insert into user (NAME, contactNumber , email , password , status , role) values('Admin', 1231231231 , 'admin@gmail.com', 'admin', 'true','admin');

create table category(
    id int not null auto_increment,
    name varchar(255) not null,
    primary key (id)
);


create table produdct(
    id int not null auto_increment,
    name varchar(255) not null,
    categoryId integer not null,
    description varchar(255),
    price integer,
    status varchar(20),
    primary key (id)
);