// Server for production environment
import fs from "fs"
import path from "path"
import { URL } from 'url'
import express from 'express'

const CONFIG_FILE = path.join(__dirname, '..', 'configs', 'config.json')
const DIST_DIR = path.join(__dirname, '..', '..', 'rekcurd_dashboard')

const config = JSON.parse(fs.readFileSync(CONFIG_FILE))
const app = express()

app.set('port', process.env.REKCURD_DASHBOARD_FRONTEND_PORT || '8080')
app.use(express.static(DIST_DIR))
app.get('*', (req, res) => { res.sendFile(DIST_DIR + '/static/dist/index.html') })

app.listen(app.get('port'))
