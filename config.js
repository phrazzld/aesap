module.exports = {
  port: process.env.PORT || 8080,
  apiUrl: "https://api.asapconnected.com/api",
  apiKey: process.env.ASAP_API_KEY,
  apiUser: process.env.ASAP_API_USER,
  apiPw: process.env.ASAP_API_PASSWORD,
  apiOrgId: process.env.ASAP_API_ORGID,
  slackVerToken: process.env.SLACK_VERIFICATION_TOKEN,
  slackCliSecret: process.env.SLACK_CLIENT_SECRET,
  slackCliId: process.env.SLACK_CLIENT_ID,
  slackTeam: process.env.SLACK_TEAM_TOKEN
}
