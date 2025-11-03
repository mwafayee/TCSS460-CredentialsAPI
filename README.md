# 🎬 Credentials / Identity Web API

> **University of Washington Tacoma**
> **School of Engineering and Technology**
> **Computer Science and Systems**
> **TCSS 460 A – Client/Server Programming for Internet Applications**
> **Autumn 2025**
> **Instructor:** Professor Charles Bryan
>
> **Team Members:**
> - Ryder DeBack
> - Faisal Nur
> - Kevin Nam Hoang
> - Mutahar Wafayee

---

## 📚 Project Overview

The **Credentials Web API** is the authentication + authorization service that our Movies Dataset Web API depends on.

This API manages secure identity services including registration, login, password management, email verification, SMS verification, and role-based authorization.

This service issues JWT tokens that the Movies Dataset Web API will consume for secure route access.

All documentation, implementation work, and development planning for this API is located in this repository.

---

## Production State Update (Completed)

The Credentials API has now been fully implemented and is 100% functional for Production Sprint.
All previously missing components have been implemented, debugged, and verified.

All credential + auth flows work end-to-end

JWT + RBAC role enforcement implemented

Email + phone verification functional

/api-docs documents current production routes

Successfully deployed to Heroku and stable

Hosted API URL (Heroku):
https://<CREDENTIALS-HEROKU-APP>.herokuapp.com

API Documentation:
https://<CREDENTIALS-HEROKU-APP>.herokuapp.com/api-docs