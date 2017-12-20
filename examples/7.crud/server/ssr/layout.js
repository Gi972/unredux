export default ({appHTML, state}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <title>7. CRUD</title>
        <link rel="icon" type="image/gif" href="/public/favicon.gif">
        <link rel="stylesheet" href="/public/bundle.css"/>
      </head>
      <body>
          <div id="root">${appHTML}</div>
          <script id="rootState">
            window.state = ${JSON.stringify(state, null, 2)}
          </script>
          <script src="/public/bundle.js"></script>
      </body>
    </html>`
}

// TODO helmet