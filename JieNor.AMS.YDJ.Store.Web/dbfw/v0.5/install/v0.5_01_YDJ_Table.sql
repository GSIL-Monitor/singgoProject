/*���ű���Ҫ������ӿ�ܷ�ҵ��ı�ṹ
**init by linus. at 2016-10-29
*/

--ҵ��������壺Ŀ����һ��ҵ������൱��һ���������ݿ⣬δ��վ�����ߺ��û��л���ͬ����ʱ����Ӧ�ķ���˴����db�����л�Ҫ���������������
if not exists (select 1 from sysobjects where name = 't_sys_bizorganization' and xtype='u')
	create table t_sys_bizorganization(
		fid varchar(36) not null,
		fnumber nvarchar(30) not null default '',
		fname nvarchar(50) not null default '',
		furl nvarchar(255) not null default '',
		fapiurl nvarchar(255) not null default '',		--���furl��·��
		fdbhost nvarchar(36) not null default '',
		fdbuser nvarchar(30) not null default '',
		fdbpassword nvarchar(50) not null default '');