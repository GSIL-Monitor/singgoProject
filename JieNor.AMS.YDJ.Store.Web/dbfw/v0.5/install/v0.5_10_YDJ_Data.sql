--add by linus. at 2017/01/03
--���ϵͳ����Ԥ�ýű���ǰ100������ϵͳ��ȫռ�á�
delete from t_sys_systemprofile where fid >='1001' and fid<='1100';
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1001','sys_systemprofile','fw','redis.host','www.jienor.com:6379',N'Redis����ʵ��');
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1002','sys_systemprofile','fw','rabbitmq.host','www.jienor.com',N'RabbitMQ��Ϣ����ʵ��');
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1003','sys_systemprofile','fw','rabbitmq.username','jienor',N'RabbitMQ��Ϣ�����û���');
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1004','sys_systemprofile','fw','rabbitmq.password','jienor.com',N'RabbitMQ��Ϣ��������');
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1005','sys_systemprofile','fw','mail.pop3','pop.exmail.qq.com',N'ϵͳ�������ŷ�����');
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1006','sys_systemprofile','fw','mail.smtp','smtp.exmail.qq.com',N'ϵͳ���䷢�ŷ�����');
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1007','sys_systemprofile','fw','mail.username','register@jienor.com',N'ϵͳ�����û���');
insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1008','sys_systemprofile','fw','mail.password','Jn@12345',N'ϵͳ�����û�����');

insert into t_sys_systemprofile(fid,FFormId,fcategory,fkey,fvalue,fdesc) values('1011','sys_systemprofile','fw','ms.authcode','d2FuZ2xpbg==',N'���ط�����֤��');
