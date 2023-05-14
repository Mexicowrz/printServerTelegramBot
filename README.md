# Telegram bot for print server

Send file to bot and write page ranges to print. The best way for printing from mobile phones.

Supported formats:
- pdf
- images (jpg, png, gif)
- office files (doc, docx, xls, odt, etc.)

### How to start 

Install additional modules to linux:

```apt install exiftool```
```apt install libreoffice```


Install Deno:  https://deno.com/manual@v1.33.2/getting_started/installation

Compile:

```deno task compile```

Start telegram bot:

```BOT_TOKEN=YOU-TOKEN ALLOW_USERS=COMMA-SEPARATED-IDS ./bin/printbot```