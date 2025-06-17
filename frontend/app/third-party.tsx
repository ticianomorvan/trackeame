import { env } from "../utils/env"

export default function ThirdParty() {
  const shouldInsertAnalytics =
    typeof env.VITE_ANALYTICS_URL !== "undefined" && 
    env.VITE_ANALYTICS_URL !== "" &&
    typeof env.VITE_ANALYTICS_WEBSITE_ID !== "undefined" &&
    env.VITE_ANALYTICS_WEBSITE_ID !== ""
 
  return (
    <>
      {shouldInsertAnalytics && (
      	<script
	  defer
	  src={env.VITE_ANALYTICS_URL}
	  data-website-id={env.VITE_ANALYTICS_WEBSITE_ID}
	/>
      )}
    </>
  )
}
