// Server for production environment
import path from "path"
import express from 'express'

const DIST_DIR = path.join(__dirname, '..', '..', 'rekcurd_dashboard')

const app = express()

app.set('port', process.env.REKCURD_DASHBOARD_FRONTEND_PORT || '8080')
app.use(express.static(DIST_DIR))
app.get('*', (req, res) => { res.sendFile(DIST_DIR + '/static/dist/index.html') })

app.listen(app.get('port'))
