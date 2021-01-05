#!/bin/bash
kubectl create ns go-admin
kubectl create configmap nginx-frontend --from-file=./default.conf -n go-admin
