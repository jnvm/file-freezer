<!--
# Merkle Migrator
# Merkle Guarantor
# nano blockchain
# merkle chain
# Petrified Sequence
# merklinator
# merkleizer
# merkle autograph
-->

# File Freezer

<table>
	<thead><tr><th>Table of Contents</th></tr></thead>
	<tbody>
		<tr><td><ul>
			<li><a href='#what'>what</a></li>
			<li><a href='#usage'>usage</a>
				<ul>
					<li><a href='#cli'>cli</a></li>
					<li><a href='#api'>api</a></li>
				</ul>
			</li>
			<li><a href='#how'>how</a></li>
			<li><a href='#but'>but</a></li>
			<li><a href='#future'>future</a></li>
			<li><a href='#changelog'>changelog</a></li>
		</ul></tr></td>
	</tbody>
</table>

## what
You want this if:

* you have 1 or a sequence of file(s) which _[must](https://tools.ietf.org/html/rfc2119#section-1) never change again_ once merged,
and you want to guarantee this with more code and [less human](https://tools.ietf.org/html/rfc6919#section-1).

Example:
* edits to already-applied migrations slipped past code review into master,
and you want to prevent this from being possible by attaching a check to PR tests.

This approach is conceptually similar to a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) or [blockchain](https://en.wikipedia.org/wiki/Blockchain),
in that it signs each file with a comment hash such that a prior change would alter subsequent signatures,
raising a red flag on the next check that either file or sequence integrity was not preserved.

## usage

### cli
```
/your/project> node file-freezer --help
    -f, --files [value]  glob string passed to npmjs.org/glob to fetch file sequence
                        (defaults to "./migrations/**/*.@(js|sql)")
                        
    -h, --help           Output usage information
    
    -r, --readOnly       Whether to write signatures to files or error in their absence.
                         Useful for tests (disabled by default)
                         
    -u, --uninstall      removes all signature comments from all files found via --files
                         (disabled by default)
                         
    -s, --silent         log nothing out (disabled by default)
```
### api
```javascript
require('file-freezer')({
	// same option flags as cli above; example:
	files:'./migrations/**/*.@(js|sql)'
})
```



## how
1. it fetches [globbed](https://www.npmjs.com/package/glob) file strings, then for each in lexical filepath sequence:
1. digests to a hash the concatenation of:
	* the previous token, if present
	* and the current file contents string minus any `file-freezer` token hash it detects
1. looks for the hash in the original source string
	* if it finds it, good, it hasn't changed
	* if it finds __no__ `file-freezer` hash
		* and `readOnly` is `false`, writes the hash in a comment atop the source
		* and `readOnly` is `true`, logs and ___exits with code 1___
	* if it finds a __different__ `file-freezer` hash, logs and ___exits with code 1___

Attaching this to your tests with `--readOnly` will catch missing signatures and errant edits to desirably immutable files / sequences even if human reviewers do not.

## but
* _"...how do I sign my new file(s) before commit?"_
	* run the check locally (without the `--readOnly` option so it defaults to `false` and signs new files)
* _"...I have to change the latest uncommitted files, and they're already hashed!"_
	* delete the hash comments atop the files and run it again, it'll update instead of alarm.


## future
* js (& sql?) AST-based hashing, so non-functional changes do not alter hash?


## changelog
* 2018-04-25 - altered token from `/*FILE-FREEZER:<HASH>*/` to `/* FILE-FREEZER:<HASH> */` to comport with common linter rules.  The matching regex was also updated, so existing signatures should still be found.