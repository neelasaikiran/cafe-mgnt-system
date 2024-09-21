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