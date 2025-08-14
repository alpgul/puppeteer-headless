FROM ubuntu:24.04


ENV USER=root
ENV DISPLAY=:0
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null

ARG ADGUARD_USERNAME
ARG ADGUARD_PASSWORD
USER root
#
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    git \
    gnupg \
    xvfb \
    x11-apps \
    dbus-x11 \
    libx11-dev \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libvulkan-dev \
    ca-certificates \
    iproute2 \
    unzip \
    nodejs \
    wget && \
    rm -rf /var/lib/apt/lists/*


# Install chrome
RUN curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add \
&& echo "deb [arch=amd64]  http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list\
&& apt-get -y update\
&& apt-get -y install google-chrome-stable

# AdGuardCLI Setup

RUN curl -fsSL https://raw.githubusercontent.com/AdguardTeam/AdGuardVPNCLI/HEAD/scripts/release/install.sh  | \
    sed 's#read -r response < /dev/tty#response=y#' | sh -s -- -v

RUN useradd -m -s /bin/bash pptrheadless
RUN usermod -aG sudo pptrheadless
RUN echo "pptrheadless ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
USER pptrheadless
# Bun Setup
RUN curl -fsSL https://bun.sh/install | bash


USER pptrheadless
COPY . /pptrheadless
WORKDIR /pptrheadless
USER root
RUN chmod +x /pptrheadless/init.sh
USER pptrheadless



EXPOSE 1080
EXPOSE 9222

