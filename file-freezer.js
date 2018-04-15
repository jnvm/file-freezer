var eachVar=require('eachvar')
	,{args,crypto,fs,glob}=eachVar(require)
	,token=`FILE-FREEZER`
	,defaultGlob='./migrations/**/*.@(js|sql)'
	,hashLength=16
	,tokenRegex=new RegExp(`\\/\\*${token}:([0-9a-f]{${hashLength}})\\*\\/\n`)
	,silent=false
	,log=(...x)=> !silent ? console.log(...x) : ''
	,failHard=(msg)=>{
		console.error(`
🚩 \u001B[0;31m${msg}\u001B[0;0m
		`)
		process.exit(1)
	}

module.exports={
	check({readOnly=false,files}){
		var found=glob.sync(files,{nodir:true})
			,lastHash=''
		found.sort().forEach(path=>{
			var fileContent=fs.readFileSync(path).toString()
				,hashInFile=(fileContent.match(tokenRegex)||[])[1]
				,originalFileContents=fileContent.replace(tokenRegex,'')
				,hashNow=crypto.createHash('md5')
					.update(lastHash+originalFileContents)
					.digest('hex')
					.slice(0,hashLength)
				,sig=`/*${token}:${hashNow}*/\n`
			
			if(hashInFile===undefined){
				if(!readOnly){
					fs.writeFileSync(path,sig+originalFileContents)
					log(`wrote ${sig.replace(/\s/g,'')} to ${path}`)
				}
				else failHard(`${path} is unsigned. Sign by running this without --readOnly`)
			}
			else if(hashInFile!==hashNow)
				failHard(`${path} has changed contents or sequence`)
			else log(`\u001B[0;92m✓\u001B[0;0m ${path}`)
			
			lastHash=hashNow
		})
		log(`--files=${files} checked: ${found.length}`)
		log(`\u001B[0;92m✓ looks good\u001B[0;0m`)
	},
	uninstall({files}){
		var count=0 
			,found=glob.sync(files,{nodir:true})
		found.forEach(path=>{
			var content=fs.readFileSync(path).toString()
			if(content.match(tokenRegex)){
				count++
				fs.writeFileSync(path,content.replace(tokenRegex,''))
			}
		})
		log(`${files} found ${found.length} files and removed ${count} ${token} signatures`)
	}
}

if(!module.parent){
	args.option('readOnly', 'Whether to write signatures to files or error in their absence. Useful for tests', false,['read-only'])
		.option('files', 'glob string passed to npmjs.org/glob to fetch file sequence', defaultGlob)
		.option('uninstall', 'removes all signature comments from all files found via --files', false)
		.option('silent', 'log nothing out', silent)

	var given = args.parse(process.argv,{name:'file-freezer'})
		,{silent}=given
	var command = given.uninstall ? 'uninstall' : 'check'
	module.exports[command](given)
}