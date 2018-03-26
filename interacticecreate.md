## Create web app

# Variables
```
WEBAPP_GROUP=
WEBAPP_PLAN=
WEBAPP_NAME=
REGISTRY_NAME=
LOCATION=westeurope
```

# Create web app

```

az group create --name $WEBAPP_GROUP --location $LOCATION
az appservice plan create --name $WEBAPP_PLAN --resource-group $WEBAPP_GROUP --location $LOCATION --is-linux --sku S1
az webapp create --name $WEBAPP_NAME --plan $WEBAPP_PLAN --resource-group $WEBAPP_GROUP --runtime "node|8.1"
az webapp config appsettings set -g $WEBAPP_GROUP -n $WEBAPP_NAME --settings WEBSITE_PORT=8000

az webapp deployment container -g $WEBAPP_GROUP -n $WEBAPP_NAME

az webapp slot slot swap