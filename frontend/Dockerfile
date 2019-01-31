FROM centos:7

RUN yum clean all && yum repolist && yum -y update

# Install node.js and yarn
RUN yum install -y gcc-c++ make | true \
    && curl -sL https://rpm.nodesource.com/setup_8.x | bash - \
    && yum install -y nodejs | true
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | \
    tee /etc/yum.repos.d/yarn.repo && \
    yum install -y yarn | true
ENV LANG=en_US.UTF-8

RUN mkdir /root/dashboard
WORKDIR /root/dashboard
