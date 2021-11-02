//
//  ViewController.swift
//  Epilogue
//
//  Created by Manton Reece on 10/27/21.
//

import UIKit
import WebKit
import UUSwiftCore

class ViewController: UIViewController, WKNavigationDelegate {

	@IBOutlet var webView: WKWebView!
	
	var token = ""
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		self.setupNotifications()
		self.setupWebView()
	}
	
	func setupNotifications() {
		NotificationCenter.default.addObserver(self, selector: #selector(tokenReceivedNotification(_:)), name: .tokenReceivedNotification, object: nil)
	}
	
	func setupWebView() {
		self.webView.navigationDelegate = self

		if let token = UUKeychain.getString(key: "Token") {
			self.token = token
			self.setupPage("index")
		}
		else {
			self.setupPage("signin")
		}
	}
	
	func setupPage(_ filename: String) {
		let url = Bundle.main.url(forResource: filename, withExtension: "html", subdirectory: "Web")
		if let url = url {
			self.webView.loadFileURL(url, allowingReadAccessTo: url)
		}
	}

	override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
		return UIInterfaceOrientationMask.portrait
	}
  
	override var shouldAutorotate: Bool {
		return false
	}

	@objc func tokenReceivedNotification(_ notification: Notification) {
		if let token = notification.userInfo?["token"] as? String {
			if token.count > 0 {
				UUKeychain.saveString(key: "Token", acceessLevel: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly, string: token)
				self.token = token
				self.setupPage("index")
			}
			else {
				UUKeychain.remove(key: "Token")
				self.token = ""
				self.setupPage("signin")
			}
		}
	}

	func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
		if self.token.count > 0 {
			let js = "document.epilogueToken = \"\(self.token)\"; checkToken();"
			self.webView.evaluateJavaScript(js)
		}
	}
	
	func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Swift.Void) {
		var handled = false
		
		if let url = navigationAction.request.url {
			if url.absoluteString.contains("epilogue://") {
				if url.host == "signin" {
					handled = true
					let token = url.lastPathComponent
					NotificationCenter.default.post(name: .tokenReceivedNotification, object: self, userInfo: [ "token": token ])
				}
				else if url.host == "signout" {
					handled = true
					self.signOut()
				}
			}
		}
		
		if handled {
			decisionHandler(.cancel)
		}
		else {
			decisionHandler(.allow)
		}
	}
	
	func signOut() {
		let alert_controller = UIAlertController(title: "", message: "Sign out of Epilogue?", preferredStyle: .alert)

		let ok_action = UIAlertAction(title: "Sign Out", style: .default) { action in
			let token = ""
			NotificationCenter.default.post(name: .tokenReceivedNotification, object: self, userInfo: [ "token": token ])
		}

		let cancel_action = UIAlertAction(title: "Cancel", style: .cancel) { action in
		}
		
		alert_controller.addAction(ok_action)
		alert_controller.addAction(cancel_action)
		
		self.present(alert_controller, animated: true)
	}

}
