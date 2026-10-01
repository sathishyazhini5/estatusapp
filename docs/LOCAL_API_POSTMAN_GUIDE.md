# eStatus local API / Postman guide

Total: **20 APIs** (4 authentication, 15 main routes, 1 photo upload). Generated from the current project routes on 1 October 2026.

## Local setup

Run from project root:

```powershell
npm.cmd start
```

Default server port: 3000. Current resolved local base URL: **http://localhost:3000/v1**. If PORT is changed in .env or the shell, update baseUrl to match the startup message. Local server still uses the database configured in .env; localhost does not imply a separate local database.

Import `eStatus.postman_collection.json` into Postman. Collection variables: baseUrl, email, verifytoken, accessToken, refreshToken, confrer_code, centre_code, scholastic_code. Replace email with an existing database user email. No secrets or real user details are included.

## Login order

1. Send login OTP: no Authorization. This sends email. Successful response stores verifytoken automatically.
2. Verify OTP: Authorization > Bearer Token > `{{verifytoken}}`. Body verifycode must be a JSON string. Successful response saves accessToken and refreshToken automatically.
3. Protected APIs: Authorization > Bearer Token > `{{accessToken}}`.
4. If access token expires, call create-token with refreshtoken in the body.

For JSON POST requests select Body > raw > JSON. Header: Content-Type: application/json. GET requests have no body. Variables are saved at collection level by the supplied collection.

## API inventory

| # | Name | Method | Local URL | Authentication |
|---|---|---|---|---|
| 1 | Send login OTP | POST | http://localhost:3000/v1/auth-email | None |
| 2 | Verify OTP | POST | http://localhost:3000/v1/auth-otp | Bearer verifytoken |
| 3 | Check access token | GET | http://localhost:3000/v1/auth-token | Bearer accessToken |
| 4 | Refresh access token | POST | http://localhost:3000/v1/create-token | None |
| 5 | List provinces | GET | http://localhost:3000/v1/list-province | Bearer accessToken |
| 6 | List countries | GET | http://localhost:3000/v1/list-country | Bearer accessToken |
| 7 | View dashboard | POST | http://localhost:3000/v1/view-dashboard | Bearer accessToken |
| 8 | Search confreres | POST | http://localhost:3000/v1/find-confreres | Bearer accessToken |
| 9 | List confrere filters | GET | http://localhost:3000/v1/list-confre-filters | Bearer accessToken |
| 10 | View confrere | POST | http://localhost:3000/v1/view-confre | Bearer accessToken |
| 11 | View scholastic | POST | http://localhost:3000/v1/view-scholastic | Bearer accessToken |
| 12 | Search centres | POST | http://localhost:3000/v1/find-centres | Bearer accessToken |
| 13 | List centre filters | GET | http://localhost:3000/v1/list-centre-filters | Bearer accessToken |
| 14 | View centre | POST | http://localhost:3000/v1/view-centre | Bearer accessToken |
| 15 | Search obituary | POST | http://localhost:3000/v1/find-obituary | Bearer accessToken |
| 16 | List obituary filters | GET | http://localhost:3000/v1/list-obituary-filters | Bearer accessToken |
| 17 | Find death anniversary | POST | http://localhost:3000/v1/find-anniversary | Bearer accessToken |
| 18 | Search scholastics | POST | http://localhost:3000/v1/find-scholastics | Bearer accessToken |
| 19 | Get app version | GET | http://localhost:3000/v1/app-version | None |
| 20 | Upload logged-in confrere photo | POST | http://localhost:3000/v1/upload-confrere-photo | Bearer accessToken |

## Request bodies and field rules

### 1. Send login OTP

**POST {{baseUrl}}/auth-email**

Required: email of an existing confrere (personal_mailid1). Sends an actual email. Save results.verifytoken. Current code uses fixed OTP 123456.

```json
{
  "email": "{{email}}"
}
```

### 2. Verify OTP

**POST {{baseUrl}}/auth-otp**

Required: verifycode as a STRING with 6 numeric digits. Bearer token is verifytoken, not accessToken. Saves results.accessToken and results.refreshToken. Success: HTTP 201.

```json
{
  "verifycode": "123456"
}
```

### 3. Check access token

**GET {{baseUrl}}/auth-token**

Body: none. Current implementation returns HTTP 200 even for missing/expired tokens; inspect results.confrer_code and results.personal_mailid1 instead of trusting the success message.

### 4. Refresh access token

**POST {{baseUrl}}/create-token**

Required: refreshtoken in JSON body (lowercase field name). No bearer token needed. Save results.accessToken. Success: HTTP 201.

```json
{
  "refreshtoken": "{{refreshToken}}"
}
```

### 5. List provinces

**GET {{baseUrl}}/list-province**

Body: none. Use rce_code for provincecode in search/dashboard requests.

### 6. List countries

**GET {{baseUrl}}/list-country**

Body: none. Returns country records.

### 7. View dashboard

**POST {{baseUrl}}/view-dashboard**

Required: provincecode. ALL = all provinces; replace with a real province_code for one province.

```json
{
  "provincecode": "ALL"
}
```

### 8. Search confreres

**POST {{baseUrl}}/find-confreres**

All fields optional. provincecode and filter fields default to ALL; searchtxt defaults to empty. searchtxt searches names/contact details. Use quick_code from memtyp/natlty/divtyp/destyp options. bloodgroup uses blood_group_code from metadata. languagecode is compared to quickcode_mst lancod; confrere filters return languagemetadata, so verify its code matches the stored language code. subdivision currently expects division NAME for ALL province searches, division_code for a specific province.

```json
{
  "provincecode": "ALL",
  "searchtxt": "",
  "memtyp": "ALL",
  "bloodgroup": "ALL",
  "natlty": "ALL",
  "languagecode": "ALL",
  "divtyp": "ALL",
  "subdivision": "ALL",
  "destyp": "ALL"
}
```

### 9. List confrere filters

**GET {{baseUrl}}/list-confre-filters**

Body: none. results contains destyp, divtyp (with divisions), memtyp, natlty, bloodgroup, language, nationality, province. Quick Master options preserve quick_code and are marked province_code=ALL.

### 10. View confrere

**POST {{baseUrl}}/view-confre**

Required: confrercode. Copy confrer_code from find-confreres results. Request field has no underscore.

```json
{
  "confrercode": "{{confrer_code}}"
}
```

### 11. View scholastic

**POST {{baseUrl}}/view-scholastic**

Required: scholasticCode (capital C). Copy scholastic_code from find-scholastics results. Missing record returns HTTP 404.

```json
{
  "scholasticCode": "{{scholastic_code}}"
}
```

### 12. Search centres

**POST {{baseUrl}}/find-centres**

All fields optional; use this complete body for testing. Filters use actual codes in ALL and province-specific views. divtyp/apostl/ctrtyp/diocse: quick_code. communitygroup: community_house_code. language: language_code. state: state_code. country: country_code. The route does not forward subdivision, so subdivision filtering is not exposed by this endpoint.

```json
{
  "provincecode": "ALL",
  "searchtxt": "",
  "divtyp": "ALL",
  "apostl": "ALL",
  "ctrtyp": "ALL",
  "diocse": "ALL",
  "communitygroup": "ALL",
  "language": "ALL",
  "state": "ALL",
  "country": "ALL"
}
```

### 13. List centre filters

**GET {{baseUrl}}/list-centre-filters**

Body: none. results contains divtyp, apostl, ctrtyp, diocse, communitygroup, language, province, state, country. Global options retain actual identifiers.

### 14. View centre

**POST {{baseUrl}}/view-centre**

Required: centrecode. Copy centre_code from find-centres results.

```json
{
  "centrecode": "{{centre_code}}"
}
```

### 15. Search obituary

**POST {{baseUrl}}/find-obituary**

All fields optional. memtyp accepts quick_code; legacy names also accepted in ALL view. For ALL province: language expects language_name, dcountry and ocountry expect country_name (legacy behavior). For a specific province: language expects language_code; country fields expect country_code. fromdate/todate: YYYY-MM-DD or empty; inclusive death-date bounds. searchtxt searches disease_name/death_place.

```json
{
  "provincecode": "ALL",
  "searchtxt": "",
  "memtyp": "ALL",
  "language": "ALL",
  "dcountry": "ALL",
  "ocountry": "ALL",
  "fromdate": "",
  "todate": ""
}
```

### 16. List obituary filters

**GET {{baseUrl}}/list-obituary-filters**

Body: none. results contains memtyp, language, province, country. For ALL-country options country_code contains the country name; this is still the legacy obituary contract.

### 17. Find death anniversary

**POST {{baseUrl}}/find-anniversary**

deathdate is required for successful execution even though the route has no validator. Use YYYY-MM-DD. Matching uses month and day, ignoring year.

```json
{
  "deathdate": "2026-10-01"
}
```

### 18. Search scholastics

**POST {{baseUrl}}/find-scholastics**

All fields optional. natlty: actual nationality quick_code from list-confre-filters results.natlty. Legacy nationality-name matching also supported for ALL. searchtxt searches name/email.

```json
{
  "provincecode": "ALL",
  "searchtxt": "",
  "natlty": "ALL"
}
```

### 19. Get app version

**GET {{baseUrl}}/app-version**

Body: none. Public endpoint; calls Apple lookup for the configured app ID. Requires internet. Response is {"version":"..."}, rather than the usual results envelope.

### 20. Upload logged-in confrere photo

**POST {{baseUrl}}/upload-confrere-photo**

Postman Body > form-data: key file, type File, choose JPG/JPEG/PNG. Do not manually set Content-Type; Postman adds the multipart boundary. No confrer_code body field: user comes from accessToken. This uploads to Azure and updates the logged-in user photo in the database. Requires Azure configuration. Success: response_code=1.

| Key | Postman type | Value |
|---|---|---|
| file | File | Select your image |

## Global filter example

Call GET /list-confre-filters, copy a real quick_code from results.memtyp, then send:

```json
{
  "provincecode": "ALL",
  "searchtxt": "",
  "memtyp": "PASTE_ACTUAL_QUICK_CODE"
}
```

ALL means no restriction for that field. Do not send display labels as Quick Master codes. To check a single province, replace provincecode with a code from /list-province. Detail request codes must come from list/search results; the Postman collection saves the first result ID automatically when available.

## Responses and troubleshooting

Typical successful read response:

```json
{ "status": true, "statuscode": 200, "code": "FETCHED", "message": "...", "results": [] }
```

Filter results are an object of arrays; searches return arrays; detail views return objects. Login/token creation succeeds with HTTP 201. Authentication failures: 401; validation failures: 422; missing resources: 404; server/database errors: 500. Photo upload and app-version use their own response format. /auth-token has the special behavior described above.

- Connection refused: start server and verify port.
- 401: check token type and expiration.
- Empty search results: use real database codes; recheck legacy language/subdivision/obituary rules above.
- Filter error says country list: that message is reused by the filter routes and does not identify the failing database query. Check Node console logs.
- No Quick Master create/update/delete API exists in this project. Quick Master changes made through the website are visible when both backends use the same database.

## Verification scope

The earlier read-only suite passed 185 syntax/database/local HTTP checks. It covered global filters, searches across provinces, dashboard queries, sampled details, authentication/validation, and centre code round-trips. OTP emailing, refresh/login flow, Azure photo upload, and external Apple lookup were not exercised by that suite. This document and collection describe those routes from source code. Importing the collection does not send any requests; run email and upload requests individually when intended.
