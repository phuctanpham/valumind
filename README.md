# Valumind

## Working flow: Upload redbook image then receive home's valuation  

```
site: appraiser.pages.dev  
app: vpbank.pages.dev  
api: api.vpbank.workers.dev  
auth: auth.vpbank.workers.dev  
```

## Development

To run the services locally, use the following commands:

* **api**: `npm --prefix api run dev`
* **app**: `npm --prefix app run dev`
* **site**: `npm --prefix site run start`
* **warp**: `npm --prefix warp run dev:node`

## Deployment

To deploy the services, use the following commands:

* **api**: `npm --prefix api run deploy`
* **app**: `npm --prefix app run deploy`
* **site**: `npm --prefix site run deploy`
* **warp**: `npm --prefix warp run deploy`
