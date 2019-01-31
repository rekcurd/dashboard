FROM centos:7

RUN set -x && \
    yum -y update && yum clean all
RUN set -x && \
    yum install -y make git gcc zlib-devel bzip2-devel openssl-devel readline-devel sqlite-devel openldap-devel && \
    git clone https://github.com/tagomoris/xbuild.git /usr/local/src/xbuild && \
    /usr/local/src/xbuild/python-install 3.6.5 /usr/local/src/python-3.6.5
RUN set -x && \
    dist=/usr/local/bin/aws-iam-authenticator && \
    curl -o $dist https://amazon-eks.s3-us-west-2.amazonaws.com/1.11.5/2018-12-06/bin/linux/amd64/aws-iam-authenticator && \
    chmod +x $dist

ENV PATH /usr/local/src/python-3.6.5/bin:$PATH

RUN pip install --upgrade pip
RUN mkdir /root/dashboard
WORKDIR /root/dashboard
