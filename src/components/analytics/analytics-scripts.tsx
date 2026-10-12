import Script from "next/script";
import { env } from "@/lib/env";

/**
 * Third-party analytics scripts, each loaded only when its ID is configured.
 * No provider is configured by default; cookie consent is still to be decided.
 */
export function AnalyticsScripts() {
  const { clarityProjectId, apolloAppId } = env;

  return (
    <>
      {clarityProjectId && (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(clarityProjectId)});`}
        </Script>
      )}
      {apolloAppId && (
        <Script id="apollo" strategy="lazyOnload">
          {`(function(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n;o.async=true;o.onload=function(){window.trackingFunctions.onLoad({appId:${JSON.stringify(apolloAppId)}})};document.head.appendChild(o);})();`}
        </Script>
      )}
    </>
  );
}
