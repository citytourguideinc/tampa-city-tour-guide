# City Tour Guide — Service Map & Rules
> READ THIS BEFORE TOUCHING ANY CLOUD RUN SERVICE

## Domain to Service Map

| Domain | Cloud Run Service | Notes |
|--------|-----------------|-------|
| tours.citytourguide.app | tours-ctg | PUBLIC no login. Shows /book. Deploy via deploy-tours.ps1 ONLY |
| tampa.citytourguide.app | Vercel auto-deploy | Preview site, basic auth |
| citytourguide.app | citytourguide | App hub - DO NOT TOUCH |
| hopper.citytourguide.app | hopper-ctg | Golf cart rides |
| waiver.citytourguide.app | ctg-waiver | Waiver signing |

## CRITICAL RULES for tours.citytourguide.app

- MUST be public - no username/password ever
- Homepage / must rewrite to /book  
- Deploy ONLY using .\deploy-tours.ps1 from pyro-eclipse folder
- NEVER run gcloud run deploy tours-ctg from any other directory
- NEVER point tours-ctg to another service image
- NEVER change middleware.js tours subdomain logic without testing

## Emergency Rollback (30 seconds to restore)
gcloud run services update-traffic tours-ctg --project=gen-lang-client-0080780188 --region=us-east1 --to-tags=working=100

## What broke it and how to avoid
1. Wrong image deployed from wrong folder - use deploy-tours.ps1
2. Traffic pinning - deploy-tours.ps1 now forces --to-latest after deploy
3. Wrong service image copied to tours-ctg - never use --image flag on tours-ctg
4. Middleware broke auth bypass - always test tours is public after any middleware change
