# node-mongoose-server

#### Create a file at the following path:
    admin-setup/firebase.service.account.json

#### Add the Firebase service account object:
    {
    "type": "service_account",
    "project_id": "a**********",
    "private_key_id": "****************************************",
    "private_key": "-----BEGIN PRIVATE KEY-----\n******************\n-----END PRIVATE KEY-----\n",
    "client_email": "********************.com",
    "client_id": "***********************",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x***/********************.com",
    "universe_domain": "googleapis.com"
    }

#### add these to your .env config
 ```
    PORT=<server_port>
    DB_URL=<mongodb_url>
    CLIENT_ID=<imgur_client_id>
    CLIENT_SECRET=<imgur_client_secret>

```

// Subscribe to stocks
{
    "action": "subscribe",
    "variables": ["AAPL", "GOOGL"],
    "type": "price"  // or "volume" or "quote"
}

// Unsubscribe from stocks
{
    "action": "unsubscribe",
    "variables": ["AAPL", "GOOGL"]
}