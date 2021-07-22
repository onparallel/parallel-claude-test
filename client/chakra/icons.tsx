import { createIcon } from "@chakra-ui/react";

export const TwitterIcon = createIcon({
  displayName: "TwitterIcon",
  viewBox: "0 0 512 512",
  path: (
    <path
      fill="currentColor"
      d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"
    />
  ),
});

export const LinkedInIcon = createIcon({
  displayName: "LinkedInIcon",
  viewBox: "0 0 448 512",
  path: (
    <path
      fill="currentColor"
      d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"
    />
  ),
});

/** same as LinkedInIcon, but with no background */
export const LinkedInSimpleIcon = createIcon({
  displayName: "LinkedInSimpleIcon",
  viewBox: "0 0 448 512",
  path: (
    <path
      fill="currentColor"
      d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"
    />
  ),
});

export const NetDocumentsIcon = createIcon({
  displayName: "NetDocumentsIcon",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path
        d="m 23,19.863877 h -2.768958 v -1.68299 c -0.459797,0.654771 -1.002093,1.141793 -1.628127,1.461891 -0.625759,0.320236 -1.257017,0.480422 -1.893501,0.480422 -1.294004,0 -2.40211,-0.530884 -3.325279,-1.591553 -0.922619,-1.060668 -1.384066,-2.541396 -1.384066,-4.440397 0,-1.941763 0.448797,-3.418462 1.347216,-4.4292184 0.897595,-1.0100549 2.032788,-1.5157905 3.404617,-1.5157905 1.258804,0 2.348072,0.5323967 3.267392,1.5968325 V 4.0463192 H 23 Z m -7.955838,-5.977501 c 0,1.222918 0.166374,2.107862 0.498572,2.654284 0.481247,0.791032 1.152518,1.186342 2.015463,1.186342 0.685845,0 1.269392,-0.296173 1.750364,-0.889756 0.480559,-0.593447 0.721045,-1.479766 0.721045,-2.659646 0,-1.316142 -0.233336,-2.263937 -0.700008,-2.842946 -0.466672,-0.578844 -1.064518,-0.868747 -1.792439,-0.868747 -0.707295,0 -1.299504,0.285943 -1.777039,0.857719 -0.477122,0.571832 -0.715958,1.426458 -0.715958,2.56275 z"
        fill="#80afdd"
      />
      <path
        d="M 11.153789,19.953664 H 8.2061375 v -5.911913 c 0,-1.250968 -0.062865,-2.059903 -0.1886489,-2.426957 C 7.8917594,11.247259 7.6873257,10.962072 7.40383,10.75823 7.1208567,10.555144 6.7795289,10.452748 6.3811801,10.452748 c -0.510383,0 -0.9687914,0.145625 -1.3742076,0.436477 -0.4056088,0.291086 -0.6834808,0.676372 -0.8337123,1.156217 -0.1504103,0.47983 -0.2257186,1.36725 -0.2257186,2.661667 v 5.246692 H 1 V 8.3697735 L 3.8412822,8.2595954 V 9.2764703 C 4.3453403,8.768026 5.5226905,8.1076588 7.4089174,8.1076588 c 0.6085712,0 1.2447935,0.1219755 1.7837214,0.3656928 0.5381716,0.2433184 0.9455132,0.5546302 1.2217072,0.9327254 0.276538,0.3782601 0.468336,0.806845 0.577167,1.286621 0.108115,0.480422 0.162207,1.167285 0.162207,2.061923 z"
        fill="#0e1139"
      />
    </>
  ),
});

export const BusinessIcon = createIcon({
  displayName: "BusinessIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m 20,12 2,2 v 8 H 11 V 18 H 8 v 4 H 2 V 4 C 2,2.9 2.9,2 4,2 h 11 c 1.1,0 2,0.9 2,2 v 18" />
      <path d="M 5,6 H 7" />
      <path d="m 12,6 h 2" />
      <path d="M 5,10 H 7" />
      <path d="m 12,10 h 2" />
      <path d="M 5,14 H 7" />
      <path d="m 12,14 h 2" />
    </g>
  ),
});

export const LockClosedIcon = createIcon({
  displayName: "LockClosedIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" />
      <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" />
    </g>
  ),
});

export const LockOpenIcon = createIcon({
  displayName: "LockOpenIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" />
      <path d="M7 11V7C7 5.76046 7.45828 4.56428 8.28938 3.64408C9.12047 2.72388 10.2638 2.14532 11.4975 2.0207C12.7312 1.89609 13.9672 2.23432 14.9655 2.96973C15.9638 3.70514 16.6533 4.78526 16.9 6" />
    </g>
  ),
});

export const GlobeIcon = createIcon({
  displayName: "GlobeIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle r="10" cy="12" cx="12" />
      <line y2="9" x2="21" y1="9" x1="3" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </g>
  ),
});

export const ConditionIcon = createIcon({
  displayName: "ConditionIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.6668 22C20.5078 22 22.0002 20.5076 22.0002 18.6667C22.0002 16.8257 20.5078 15.3333 18.6668 15.3333C16.8259 15.3333 15.3335 16.8257 15.3335 18.6667C15.3335 20.5076 16.8259 22 18.6668 22Z" />
      <path d="M5.33333 8.66667C7.17428 8.66667 8.66667 7.17428 8.66667 5.33333C8.66667 3.49238 7.17428 2 5.33333 2C3.49238 2 2 3.49238 2 5.33333C2 7.17428 3.49238 8.66667 5.33333 8.66667Z" />
      <path d="M5.3335 8.66666C5.3335 12.0829 5.3335 15.2904 5.3335 17.1124C5.3335 17.9715 6.02757 18.6667 6.88668 18.6667C8.64952 18.6667 11.7499 18.6667 15.3335 18.6667" />
    </g>
  ),
});

export const PaperclipIcon = createIcon({
  displayName: "PaperclipIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m 21.980322,11.377657 -9.446246,8.917978 c -1.157243,1.092522 -2.7267888,1.7062 -4.3633668,1.7062 -1.6365781,0 -3.2061403,-0.613678 -4.3633669,-1.7062 -1.1572443,-1.092521 -1.8073666,-2.574384 -1.8073666,-4.119368 0,-1.545048 0.6501223,-3.026825 1.8073666,-4.119331 L 13.25358,3.1389951 c 0.771496,-0.728331 1.817872,-1.1375172 2.908911,-1.1375172 1.091059,0 2.137424,0.4091862 2.908919,1.1375172 0.771496,0.7283476 1.204911,1.7161837 1.204911,2.7462205 0,1.0300368 -0.433415,2.0178727 -1.204911,2.7462203 L 9.6148729,17.549415 c -0.3857309,0.364174 -0.9089182,0.568677 -1.4544384,0.568677 -0.5455379,0 -1.0687253,-0.204503 -1.4544557,-0.568677 -0.385748,-0.364174 -0.6024556,-0.858136 -0.6024556,-1.373148 0,-0.515027 0.2167076,-1.008937 0.6024556,-1.373109 L 15.432695,6.5741957" />
    </g>
  ),
});

export const KeyIcon = createIcon({
  displayName: "KeyIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </g>
  ),
});

export const QuoteIcon = createIcon({
  displayName: "QuoteIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="none"
      strokeWidth={2}
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"></path>
    </g>
  ),
});

export const LogOutIcon = createIcon({
  displayName: "LogOutIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </g>
  ),
});

export const AlertCircleIcon = createIcon({
  displayName: "AlertCircleIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.1" y2="16"></line>
    </g>
  ),
});

export const PaperPlaneIcon = createIcon({
  displayName: "PaperPlaneIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.5 17L18 6.5L8.5 15" />
      <path d="M22 2L17.5 21L11.5 17L8.5 21.5V15L2.5 11L22 2Z" />
    </g>
  ),
});

export const PaperPlanesIcon = createIcon({
  displayName: "PaperPlanesIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(0,-6)">
        <path d="m 2,18 6,4 2,-8 z" />
        <path d="M 5.5,20.333333 4.5,22 V 19.666667 L 6,19 Z" />
      </g>
      <g transform="translate(12,-12)">
        <path d="m 2,18 6,4 2,-8 z" />
        <path d="M 5.5,20.333333 4.5,22 V 19.666667 L 6,19 Z" />
      </g>
      <g transform="translate(9)">
        <path d="m 2,18 6,4 2,-8 z" />
        <path d="M 5.5,20.333333 4.5,22 V 19.666667 L 6,19 Z" />
      </g>
    </g>
  ),
});

export const UsersIcon = createIcon({
  displayName: "UsersIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </g>
  ),
});

export const BellIcon = createIcon({
  displayName: "BellIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </g>
  ),
});

export const BellOffIcon = createIcon({
  displayName: "BellOffIcon",
  viewBox: "0 0 16 16",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={1.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.15335 14C9.03614 14.2021 8.86791 14.3698 8.6655 14.4864C8.46309 14.6029 8.2336 14.6643 8.00001 14.6643C7.76643 14.6643 7.53694 14.6029 7.33453 14.4864C7.13212 14.3698 6.96389 14.2021 6.84668 14" />
      <path d="M12.42 8.66671C12.1234 7.58098 11.982 6.45874 12 5.33337" />
      <path d="M4.17333 4.17334C4.05751 4.54908 3.99907 4.94015 4 5.33334C4 10 2 11.3333 2 11.3333H11.3333" />
      <path d="M12 5.33333C12.0011 4.6087 11.8053 3.8974 11.4336 3.27539C11.0619 2.65338 10.5281 2.14403 9.88944 1.80175C9.25075 1.45948 8.53108 1.29712 7.8073 1.33204C7.08351 1.36696 6.38281 1.59783 5.78003 2" />
      <path d="M0.666687 0.666626L15.3334 15.3333" />
    </g>
  ),
});

export const BellSettingsIcon = createIcon({
  displayName: "BellSettingsIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 18,9 C 18,7.3431446 17.328427,5.8431453 16.24264,4.7573598 15.156854,3.6715743 13.656854,3.0000026 12,3.0000026 c -1.656854,0 -3.1568542,0.6715717 -4.2426407,1.7573572 C 6.6715729,5.8431453 6,7.3431446 6,9 6,16 3,18 3,18 h 6" />
      <path d="m 12,21.996456 c -0.672324,0 -1.344648,-0.332152 -1.73,-0.996456" />
      <path d="m 18.544148,20.272074 -0.263573,1.027536 c -0.09448,0.369552 -0.491624,0.672543 -0.882366,0.672543 H 16.68777 c -0.390742,0 -0.787878,-0.302991 -0.882366,-0.672543 l -0.263573,-1.027536 c -0.09449,-0.369552 -0.479548,-0.586569 -0.854659,-0.48118 l -1.042216,0.291204 c -0.375822,0.104692 -0.844002,-0.07904 -1.038662,-0.409766 l -0.35522,-0.601129 C 12.056413,18.740477 12.125326,18.25375 12.40666,17.988199 l 0.780063,-0.735638 c 0.281334,-0.265551 0.281334,-0.69889 -7.1e-4,-0.963747 L 12.40737,15.553175 c -0.281334,-0.264857 -0.350957,-0.751584 -0.156296,-1.082309 l 0.35593,-0.601129 c 0.195371,-0.330725 0.66284,-0.514462 1.037952,-0.409766 l 1.042216,0.291204 c 0.375823,0.104692 0.76017,-0.111622 0.855369,-0.481181 l 0.262863,-1.026149 c 0.09448,-0.368859 0.491624,-0.67185 0.882366,-0.67185 h 0.710439 c 0.390742,0 0.787878,0.302991 0.882366,0.672544 l 0.262863,1.026148 c 0.0952,0.369552 0.479546,0.586569 0.855369,0.481874 l 1.042216,-0.291204 c 0.375823,-0.105392 0.844002,0.07904 1.038662,0.409073 l 0.355221,0.601129 c 0.19466,0.330725 0.125743,0.817453 -0.156298,1.083004 l -0.778641,0.734251 c -0.280624,0.26555 -0.280624,0.698889 0,0.96444 l 0.780062,0.735638 c 0.280624,0.265551 0.350958,0.752279 0.155587,1.083004 l -0.355931,0.601129 c -0.19466,0.330725 -0.662839,0.514461 -1.038662,0.409766 l -1.042216,-0.291204 c -0.375111,-0.106082 -0.76017,0.110935 -0.854659,0.480487 z" />
      <path d="m 16.987622,16.779971 v 0"></path>
    </g>
  ),
});

export const MoreVerticalIcon = createIcon({
  displayName: "MoreVerticalIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <circle cx="12" cy="3" r="3"></circle>
      <circle cx="12" cy="21" r="3"></circle>
    </g>
  ),
});

export const MoreIcon = createIcon({
  displayName: "MoreIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <circle cx="3" cy="12" r="3"></circle>
      <circle cx="21" cy="12" r="3"></circle>
    </g>
  ),
});

export const PlusCircleIcon = createIcon({
  displayName: "PlusCircleIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </g>
  ),
});

export const PlusCircleFilledIcon = createIcon({
  displayName: "PlusCircleFilledIcon",
  viewBox: "0 0 20 20",
  path: (
    <g strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M10.0001 18.3332C14.6025 18.3332 18.3334 14.6022 18.3334 9.99984C18.3334 5.39746 14.6025 1.6665 10.0001 1.6665C5.39771 1.6665 1.66675 5.39746 1.66675 9.99984C1.66675 14.6022 5.39771 18.3332 10.0001 18.3332Z"
        fill="currentColor"
      />
      <path d="M10 6.6665V13.3332" stroke="white" />
      <path d="M6.66675 10H13.3334" stroke="white" />
    </g>
  ),
});

export const XCircleIcon = createIcon({
  displayName: "XCircleIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </g>
  ),
});

export const UserIcon = createIcon({
  displayName: "UserIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </g>
  ),
});

export const UserXIcon = createIcon({
  displayName: "UserXIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="18" y1="8" x2="23" y2="13"></line>
      <line x1="23" y1="8" x2="18" y2="13"></line>
    </g>
  ),
});

export const UserPlusIcon = createIcon({
  displayName: "UserPlusIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="20" y1="8" x2="20" y2="14"></line>
      <line x1="23" y1="11" x2="17" y2="11"></line>
    </g>
  ),
});

export const UserArrowIcon = createIcon({
  displayName: "UserArrowIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle r="4" cy="7" cx="8.5" />
      <line y2="11" x2="16" y1="11" x1="23" />
      <path d="m 19,7 4,4 -4,4" />
    </g>
  ),
});

export const UserCheckIcon = createIcon({
  displayName: "UserCheckIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <polyline points="17 11 19 13 23 9"></polyline>
    </g>
  ),
});

export const FileTextIcon = createIcon({
  displayName: "FileTextIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </g>
  ),
});

export const FileNewIcon = createIcon({
  displayName: "FileNewIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </g>
  ),
});

export const FileShineIcon = createIcon({
  displayName: "FileShineIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M 12,12.523314 V 10.993793" />
      <path d="M 14.355469,14.234662 15.81013,13.762014" />
      <path d="m 13.45576,17.003681 0.89903,1.237409" />
      <path d="M 10.54424,17.003681 9.6452102,18.24109" />
      <path d="M 9.6445314,14.234662 8.1898703,13.762014" />
    </g>
  ),
});

export const ClipboardIcon = createIcon({
  displayName: "ClipboardIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
    </g>
  ),
});

export const CommentIcon = createIcon({
  displayName: "CommentIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m 21,13 c 0,2 -2,4 -4,4 H 12 L 9,21 8,17 H 7 C 5,17 3,15 3,13 V 7 C 3,5 5,3 7,3 h 10 c 2,0 4,2 4,4 z" />
    </g>
  ),
});

export const DeleteIcon = createIcon({
  displayName: "DeleteIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </g>
  ),
});

export const SettingsIcon = createIcon({
  displayName: "SettingsIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </g>
  ),
});

export const CommentXIcon = createIcon({
  displayName: "CommentXIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 15,17 H 12 L 9,21 8,17 H 7 C 5,17 3,15 3,13 V 7 C 3,5 5,3 7,3 h 10 c 2,0 4,2 4,4 v 6" />
      <line y2="20" x2="23" y1="15" x1="18" />
      <line y2="20" x2="18" y1="15" x1="23" />
    </g>
  ),
});

export const FilterIcon = createIcon({
  displayName: "FilterIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </g>
  ),
});

export const PencilIcon = createIcon({
  displayName: "PencilIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </g>
  ),
});

export const ForbiddenIcon = createIcon({
  displayName: "ForbiddenIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </g>
  ),
});

export const ChevronDownBigIcon = createIcon({
  displayName: "ChevronDownBigIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2 8 12 18 22 8"></polyline>
    </g>
  ),
});

export const ChevronUpBigIcon = createIcon({
  displayName: "ChevronUpBigIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2 18 12 8 22 18"></polyline>
    </g>
  ),
});

export const ChevronDownIcon = createIcon({
  displayName: "ChevronDownIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 8 12 16 20 8"></polyline>
    </g>
  ),
});

export const ChevronUpIcon = createIcon({
  displayName: "ChevronUpIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 16 12 8 20 16"></polyline>
    </g>
  ),
});

export const ChevronLeftIcon = createIcon({
  displayName: "ChevronLeftIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="currentColor"
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
    ></path>
  ),
});

export const ChevronRightIcon = createIcon({
  displayName: "ChevronRightIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="currentColor"
      d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
    ></path>
  ),
});

export const ArrowUpDownIcon = createIcon({
  displayName: "ArrowUpDownIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 14 12 22 20 14"></polyline>
      <polyline points="4 10 12 2 20 10"></polyline>
    </g>
  ),
});

export const CheckShortIcon = createIcon({
  displayName: "CheckShortIcon",
  viewBox: "0 0 14 14",
  path: (
    <g
      stroke=""
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5.5 12 14 3.5 12.5 2 5.5 9 3.5 7 2 8.5"></polygon>
    </g>
  ),
});

export const EmailIcon = createIcon({
  displayName: "EmailIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </g>
  ),
});

export const EmailSentIcon = createIcon({
  displayName: "EmailSentIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 10,20 H 4 C 2.9,20 2,19.1 2,18 V 6 C 2,4.9 2.9,4 4,4 h 16 c 1.1,0 2,0.9 2,2 v 9" />
      <polyline points="22,6 12,13 2,6" />
      <path d="m 14,20 c 8,0 8,0 8,0" />
      <path d="m 19,17 3,3 -3,3" />
    </g>
  ),
});

export const EmailXIcon = createIcon({
  displayName: "EmailXIcon",
  viewBox: "0 0 16 16",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.6668 7.66699V4.00033C14.6668 3.26699 14.0668 2.66699 13.3335 2.66699H2.66683C1.9335 2.66699 1.3335 3.26699 1.3335 4.00033V12.0003C1.3335 12.7337 1.9335 13.3337 2.66683 13.3337H8.66683" />
      <path d="M14 3.33301L8 7.66634L2 3.33301" />
      <path d="M11.3335 10L14.6668 13.3333" />
      <path d="M14.6668 10L11.3335 13.3333" />
    </g>
  ),
});

export const EmailOpenedIcon = createIcon({
  displayName: "EmailOpenedIcon",
  viewBox: "0 0 17 16",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.16667 5.33301L8.5 8.66634L13.8333 5.33301L15.1667 6.41634V12.9163C15.1667 13.5122 14.5667 13.9997 13.8333 13.9997H3.16667C2.43334 13.9997 1.83334 13.5122 1.83334 12.9163V6.41634C1.83334 6.33301 3.16667 5.33301 3.16667 5.33301Z" />
      <path d="M15.1667 6.33301L8.5 1.33301L1.83334 6.33301" />
    </g>
  ),
});

export const ShinyIcon = createIcon({
  displayName: "ShinyIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </g>
  ),
});

export const SaveIcon = createIcon({
  displayName: "SaveIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </g>
  ),
});

export const ArrowForwardIcon = createIcon({
  displayName: "ArrowForwardIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 19 7-7-7-7" />
      <path d="m2 12h20" />
    </g>
  ),
});

export const ArrowBackIcon = createIcon({
  displayName: "ArrowBackIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 5 -7 7 7 7" />
      <path d="m2 12h20" />
    </g>
  ),
});

export const BoldIcon = createIcon({
  displayName: "BoldIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
    </g>
  ),
});

export const ItalicIcon = createIcon({
  displayName: "ItalicIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="4" x2="10" y2="4"></line>
      <line x1="14" y1="20" x2="5" y2="20"></line>
      <line x1="15" y1="4" x2="9" y2="20"></line>
    </g>
  ),
});

export const UnderlineIcon = createIcon({
  displayName: "UnderlineIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
      <line x1="4" y1="21" x2="20" y2="21"></line>
    </g>
  ),
});

export const ListIcon = createIcon({
  displayName: "ListIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </g>
  ),
});

export const EyeIcon = createIcon({
  displayName: "EyeIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </g>
  ),
});

export const EyeOffIcon = createIcon({
  displayName: "EyeOffIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </g>
  ),
});

export const QuestionIcon = createIcon({
  displayName: "QuestionIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="currentColor"
      d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,19a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,12,19Zm1.6-6.08a1,1,0,0,0-.6.917,1,1,0,1,1-2,0,3,3,0,0,1,1.8-2.75A2,2,0,1,0,10,9.255a1,1,0,1,1-2,0,4,4,0,1,1,5.6,3.666Z"
    ></path>
  ),
});

export const CheckIcon = createIcon({
  displayName: "CheckIcon",
  viewBox: "0 0 14 14",
  path: (
    <polygon
      fill="currentColor"
      points="5.5 11.9993304 14 3.49933039 12.5 2 5.5 8.99933039 1.5 4.9968652 0 6.49933039"
    ></polygon>
  ),
});

export const DoubleCheckIcon = createIcon({
  displayName: "DoubleCheckIcon",
  viewBox: "0 0 24 24",
  path: (
    <g stroke="currentColor" strokeWidth="0.5" fill="currentColor">
      <path d="M11.602 13.76l1.412 1.412 8.466-8.466 1.414 1.414-9.88 9.88-6.364-6.364 1.414-1.414 2.125 2.125 1.413 1.412zm.002-2.828l4.952-4.953 1.41 1.41-4.952 4.953-1.41-1.41zm-2.827 5.655L7.364 18 1 11.636l1.414-1.414 1.413 1.413-.001.001 4.951 4.951z"></path>
    </g>
  ),
});

export const TimeIcon = createIcon({
  displayName: "TimeIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="currentColor">
      <path d="M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm0,22A10,10,0,1,1,22,12,10.011,10.011,0,0,1,12,22Z"></path>
      <path d="M17.134,15.81,12.5,11.561V6.5a1,1,0,0,0-2,0V12a1,1,0,0,0,.324.738l4.959,4.545a1.01,1.01,0,0,0,1.413-.061A1,1,0,0,0,17.134,15.81Z"></path>
    </g>
  ),
});

export const EditIcon = createIcon({
  displayName: "EditIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </g>
  ),
});

export const EditSimpleIcon = createIcon({
  displayName: "EditSimpleIcon",
  viewBox: "0 0 16 16",
  path: (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
      <path d="M8 13.3333H14" />
      <path d="M11 2.33334C11.2652 2.06813 11.6249 1.91913 12 1.91913C12.1857 1.91913 12.3696 1.95571 12.5412 2.02678C12.7128 2.09785 12.8687 2.20202 13 2.33334C13.1313 2.46466 13.2355 2.62057 13.3066 2.79215C13.3776 2.96373 13.4142 3.14762 13.4142 3.33334C13.4142 3.51906 13.3776 3.70296 13.3066 3.87454C13.2355 4.04612 13.1313 4.20202 13 4.33334L4.66667 12.6667L2 13.3333L2.66667 10.6667L11 2.33334Z" />
    </g>
  ),
});

export const SearchIcon = createIcon({
  displayName: "SearchIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="currentColor"
      d="M23.384,21.619,16.855,15.09a9.284,9.284,0,1,0-1.768,1.768l6.529,6.529a1.266,1.266,0,0,0,1.768,0A1.251,1.251,0,0,0,23.384,21.619ZM2.75,9.5a6.75,6.75,0,1,1,6.75,6.75A6.758,6.758,0,0,1,2.75,9.5Z"
    ></path>
  ),
});

export const RepeatIcon = createIcon({
  displayName: "RepeatIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="currentColor">
      <path d="M10.319,4.936a7.239,7.239,0,0,1,7.1,2.252,1.25,1.25,0,1,0,1.872-1.657A9.737,9.737,0,0,0,9.743,2.5,10.269,10.269,0,0,0,2.378,9.61a.249.249,0,0,1-.271.178l-1.033-.13A.491.491,0,0,0,.6,9.877a.5.5,0,0,0-.019.526l2.476,4.342a.5.5,0,0,0,.373.248.43.43,0,0,0,.062,0,.5.5,0,0,0,.359-.152l3.477-3.593a.5.5,0,0,0-.3-.844L5.15,10.172a.25.25,0,0,1-.2-.333A7.7,7.7,0,0,1,10.319,4.936Z"></path>
      <path d="M23.406,14.1a.5.5,0,0,0,.015-.526l-2.5-4.329A.5.5,0,0,0,20.546,9a.489.489,0,0,0-.421.151l-3.456,3.614a.5.5,0,0,0,.3.842l1.848.221a.249.249,0,0,1,.183.117.253.253,0,0,1,.023.216,7.688,7.688,0,0,1-5.369,4.9,7.243,7.243,0,0,1-7.1-2.253,1.25,1.25,0,1,0-1.872,1.656,9.74,9.74,0,0,0,9.549,3.03,10.261,10.261,0,0,0,7.369-7.12.251.251,0,0,1,.27-.179l1.058.127a.422.422,0,0,0,.06,0A.5.5,0,0,0,23.406,14.1Z"></path>
    </g>
  ),
});

export const AddIcon = createIcon({
  displayName: "AddIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="currentColor"
      d="M0,12a1.5,1.5,0,0,0,1.5,1.5h8.75a.25.25,0,0,1,.25.25V22.5a1.5,1.5,0,0,0,3,0V13.75a.25.25,0,0,1,.25-.25H22.5a1.5,1.5,0,0,0,0-3H13.75a.25.25,0,0,1-.25-.25V1.5a1.5,1.5,0,0,0-3,0v8.75a.25.25,0,0,1-.25.25H1.5A1.5,1.5,0,0,0,0,12Z"
    ></path>
  ),
});

export const InfoOutlineIcon = createIcon({
  displayName: "InfoOutlineIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
      <circle cx="12" cy="12" r="11" stroke="currentColor"></circle>
      <line x1="12" x2="12" y1="11" y2="17"></line>
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none"></circle>
    </g>
  ),
});

export const HelpOutlineIcon = createIcon({
  displayName: "HelpOutlineIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
      <circle cx="12" cy="12" r="11"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </g>
  ),
});

export const DragHandleIcon = createIcon({
  displayName: "DragHandleIcon",
  viewBox: "0 0 10 10",
  path: (
    <path
      fill="currentColor"
      d="M3,2 C2.44771525,2 2,1.55228475 2,1 C2,0.44771525 2.44771525,0 3,0 C3.55228475,0 4,0.44771525 4,1 C4,1.55228475 3.55228475,2 3,2 Z M3,6 C2.44771525,6 2,5.55228475 2,5 C2,4.44771525 2.44771525,4 3,4 C3.55228475,4 4,4.44771525 4,5 C4,5.55228475 3.55228475,6 3,6 Z M3,10 C2.44771525,10 2,9.55228475 2,9 C2,8.44771525 2.44771525,8 3,8 C3.55228475,8 4,8.44771525 4,9 C4,9.55228475 3.55228475,10 3,10 Z M7,2 C6.44771525,2 6,1.55228475 6,1 C6,0.44771525 6.44771525,0 7,0 C7.55228475,0 8,0.44771525 8,1 C8,1.55228475 7.55228475,2 7,2 Z M7,6 C6.44771525,6 6,5.55228475 6,5 C6,4.44771525 6.44771525,4 7,4 C7.55228475,4 8,4.44771525 8,5 C8,5.55228475 7.55228475,6 7,6 Z M7,10 C6.44771525,10 6,9.55228475 6,9 C6,8.44771525 6.44771525,8 7,8 C7.55228475,8 8,8.44771525 8,9 C8,9.55228475 7.55228475,10 7,10 Z"
    ></path>
  ),
});

export const CopyIcon = createIcon({
  displayName: "CopyIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="currentColor"
      d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
    ></path>
  ),
});

export const DownloadIcon = createIcon({
  displayName: "DownloadIcon",
  viewBox: "0 0 14 14",
  path: (
    <path
      fill="currentColor"
      d="M11.2857,6.05714 L10.08571,4.85714 L7.85714,7.14786 L7.85714,1 L6.14286,1 L6.14286,7.14786 L3.91429,4.85714 L2.71429,6.05714 L7,10.42857 L11.2857,6.05714 Z M1,11.2857 L1,13 L13,13 L13,11.2857 L1,11.2857 Z"
    ></path>
  ),
});

export const CloseIcon = createIcon({
  displayName: "CloseIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="currentColor"
      d="M.439,21.44a1.5,1.5,0,0,0,2.122,2.121L11.823,14.3a.25.25,0,0,1,.354,0l9.262,9.263a1.5,1.5,0,1,0,2.122-2.121L14.3,12.177a.25.25,0,0,1,0-.354l9.263-9.262A1.5,1.5,0,0,0,21.439.44L12.177,9.7a.25.25,0,0,1-.354,0L2.561.44A1.5,1.5,0,0,0,.439,2.561L9.7,11.823a.25.25,0,0,1,0,.354Z"
    ></path>
  ),
});

export const SmallCloseIcon = createIcon({
  displayName: "SmallCloseIcon",
  viewBox: "0 0 16 16",
  path: (
    <path
      d="M9.41 8l2.29-2.29c.19-.18.3-.43.3-.71a1.003 1.003 0 0 0-1.71-.71L8 6.59l-2.29-2.3a1.003 1.003 0 0 0-1.42 1.42L6.59 8 4.3 10.29c-.19.18-.3.43-.3.71a1.003 1.003 0 0 0 1.71.71L8 9.41l2.29 2.29c.18.19.43.3.71.3a1.003 1.003 0 0 0 .71-1.71L9.41 8z"
      fillRule="evenodd"
      fill="currentColor"
    ></path>
  ),
});

export const FieldFileUploadIcon = createIcon({
  displayName: "FieldFileUploadIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 11h3l4 4v5h-20v-5l4-4h3" />
      <path d="m2 15h6l1 2h6l1-2h6" />
      <path d="m12 12v-8" />
      <path d="m15 8-3-4-3 4" />
    </g>
  ),
});

export const FieldTextIcon = createIcon({
  displayName: "FieldTextIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.83333"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.5099 10.7559L11.2099 10.7559" />
      <path d="M2.27493 19.9668H21.8459" />
      <path d="M2 15.3633H21.571" />
      <path d="M2.27493 11.9074L5.08107 5L7.88721 11.9074" />
      <path d="M3.40021 10.0381L6.77634 10.0381" />
    </g>
  ),
});

export const FieldShortTextIcon = createIcon({
  displayName: "FieldShortTextIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.64999 16.7634L6.81909 6.50098L10.9882 16.7634" />
      <path d="M19.2281 15.6087C18.6 16.9502 13.65 17.7876 13.65 14.2565C13.65 10.7255 16.95 10.4066 19.15 11.1271C19.15 12.6071 19.15 14.9762 19.15 15.1283C19.15 16.6858 21.35 16.9502 21.35 16.9502" />
      <path d="M4.32188 14.0918L9.33783 14.0918" />
    </g>
  ),
});

export const FieldHeadingIcon = createIcon({
  displayName: "FieldHeadingIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.25357 19L8.30002 6" />
      <path d="M2.85001 5H13.85" />
      <path d="M17.6875 19V10" />
      <path d="M14.25 10.001H21.125" />
    </g>
  ),
});

export const FieldCheckboxIcon = createIcon({
  displayName: "FieldCheckboxIcon",
  viewBox: "0 0 16 16",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="12" height="12" rx="1.42077" />
      <path d="M5 8L7 10L11 6" />
    </g>
  ),
});

export const CloudUploadIcon = createIcon({
  displayName: "CloudUploadIcon",
  viewBox: "0 0 24 24",
  path: (
    <g stroke="currentColor" fill="currentColor" strokeWidth="0">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3zM8 13h2.55v3h2.9v-3H16l-4-4z" />
    </g>
  ),
});

export const CloudOkIcon = createIcon({
  displayName: "CloudOkIcon",
  viewBox: "0 0 24 24",
  path: (
    <g stroke="currentColor" fill="currentColor" strokeWidth="0">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3zm-9-3.82l-2.09-2.09L6.5 13.5 10 17l6.01-6.01-1.41-1.41z" />
    </g>
  ),
});

export const CloudErrorIcon = createIcon({
  displayName: "CloudErrorIcon",
  viewBox: "0 0 24 24",
  path: (
    <g stroke="currentColor" fill="currentColor" strokeWidth="0">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M24 15c0-2.64-2.05-4.78-4.65-4.96C18.67 6.59 15.64 4 12 4c-1.33 0-2.57.36-3.65.97l1.49 1.49C10.51 6.17 11.23 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 .99-.48 1.85-1.21 2.4l1.41 1.41c1.09-.92 1.8-2.27 1.8-3.81zM4.41 3.86L3 5.27l2.77 2.77h-.42C2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h11.73l2 2 1.41-1.41L4.41 3.86zM6 18c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73l8 8H6z" />
    </g>
  ),
});

export const ThumbUpIcon = createIcon({
  displayName: "ThumbUpIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </g>
  ),
});

export const SignatureIcon = createIcon({
  displayName: "SignatureIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m 7.5000748,2.5 c -1.9999991,-1.99999913 -4.9999991,1.0000009 -3,3 l 9.5000002,9.5 4,1 -1,-4 z" />
      <path d="M 2,22 C 3.1649453,21.417527 7.3693738,17.42089 7.2090576,15.068107 7,12 3,12 2.3116295,14.810237 1.7796301,16.982097 4,20 5,21 6,22 8,23 9.501696,20.381818 12.040646,15.9552 11.260423,21.990344 13,22 15,22 15.851017,17.833359 16.874752,19.354938 20,24 24,22 22,19" />
    </g>
  ),
});

export const SignaturePlusIcon = createIcon({
  displayName: "SignaturePlusIcon",
  viewBox: "0 0 16 16",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.34481"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.2869 2.39422C3.09152 1.19883 1.29844 2.99191 2.49383 4.18729L8.17189 9.86535L10.5627 10.463L9.96496 8.07228L4.2869 2.39422Z" />
      <path d="M1 14.0491C1.69628 13.701 4.20923 11.3122 4.11341 9.90598C3.98846 8.0722 1.59769 8.0722 1.18626 9.75185C0.868287 11.05 2.19538 12.8537 2.79307 13.4514C3.39076 14.0491 4.58615 14.6468 5.4837 13.0819C7.0012 10.4362 6.53487 14.0433 7.5746 14.0491C8.76998 14.0491 9.27863 11.5587 9.89051 12.4682C11.7584 15.2445 14.1492 14.0491 12.9538 12.256" />
      <path d="M13 3V7" />
      <path d="M15 5H11" />
    </g>
  ),
});

export const FieldDynamicSelectIcon = createIcon({
  displayName: "FieldDynamicSelectIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="1" width="22" height="11.444" rx="1.15183" />
      <path d="M5 9.82732L7.52783 3L10.0557 9.82732" />
      <path d="M15 6L17 8L19 6" />
      <path d="M5.83224 7.99121H9.36949" />
      <path d="M11.75 14.7824C11.75 14.4884 11.9884 14.25 12.2824 14.25H21.7176C22.0116 14.25 22.25 14.4884 22.25 14.7824V21.7176C22.25 22.0116 22.0116 22.25 21.7176 22.25H12.2824C11.9884 22.25 11.75 22.0116 11.75 21.7176V14.7824Z" />
      <path d="M15 17.25L17 19.25L19 17.25" />
      <path d="M8.2973 21.0946C9.01377 21.0946 9.59459 20.5138 9.59459 19.7973C9.59459 19.0808 9.01377 18.5 8.2973 18.5C7.58082 18.5 7 19.0808 7 19.7973C7 20.5138 7.58082 21.0946 8.2973 21.0946Z" />
      <path d="M2.5 14.2001C2.5 15.999 2.5 18.5255 2.5 19.546C2.5 19.7968 2.70249 20 2.95326 20C3.61697 20 4.94471 20 6.5 20" />
    </g>
  ),
});

export const FieldSelectIcon = createIcon({
  displayName: "FieldSelectIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 22,19 H 2 V 5 c 6.6666667,0 13.333333,0 20,0 v 14" />
      <path d="m 5,16 3,-8 3,8" />
      <path d="m 6,14 h 4" />
      <path d="m 13,11 3,3 3,-3" />
    </g>
  ),
});

export const DownForwardArrowIcon = createIcon({
  displayName: "DownForwardArrowIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 15,19 22,12 15,5" />
      <path d="M 2,12 H 22" />
      <path d="M 2,12 V 5" />
    </g>
  ),
});

export const SharpIcon = createIcon({
  displayName: "SharpIcon", // (#)
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9"></line>
      <line x1="4" y1="15" x2="20" y2="15"></line>
      <line x1="10" y1="3" x2="8" y2="21"></line>
      <line x1="16" y1="3" x2="14" y2="21"></line>
    </g>
  ),
});

export const UserGroupArrowIcon = createIcon({
  displayName: "UserGroupArrowIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.6997 10.8H17.6997" />
      <path d="M20.6997 13.2L22.6997 10.8L20.6997 8.19995" />
      <path d="M13.9999 19.8V17.8C13.9999 16.7392 13.668 15.7218 13.0773 14.9716C12.4865 14.2215 11.6853 13.8 10.8499 13.8H4.5499C3.71447 13.8 2.91326 14.2215 2.32252 14.9716C1.73178 15.7218 1.3999 16.7392 1.3999 17.8V19.8" />
      <path d="M7.60441 10.2C9.26365 10.2 10.6087 8.85681 10.6087 7.19995C10.6087 5.5431 9.26365 4.19995 7.60441 4.19995C5.94518 4.19995 4.6001 5.5431 4.6001 7.19995C4.6001 8.85681 5.94518 10.2 7.60441 10.2Z" />
      <path d="M17.6997 19.8V17.7558C17.6993 16.8499 17.5026 15.9698 17.1406 15.2539C16.7786 14.5379 16.2718 14.0265 15.6997 13.8" />
      <path d="M13.1997 4.20117C13.7711 4.37173 14.2775 4.75913 14.6391 5.30232C15.0008 5.8455 15.1971 6.51356 15.1971 7.20117C15.1971 7.88879 15.0008 8.55685 14.6391 9.10003C14.2775 9.64321 13.7711 10.0306 13.1997 10.2012" />
    </g>
  ),
});

export const UserGroupXIcon = createIcon({
  displayName: "UserGroupXIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.1 19.8V17.8C14.1 16.7392 13.7681 15.7218 13.1774 14.9716C12.5866 14.2215 11.7854 13.8 10.95 13.8H4.65C3.81457 13.8 3.01335 14.2215 2.42261 14.9716C1.83187 15.7218 1.5 16.7392 1.5 17.8V19.8" />
      <path d="M7.70451 10.2C9.36375 10.2 10.7088 8.85681 10.7088 7.19995C10.7088 5.5431 9.36375 4.19995 7.70451 4.19995C6.04527 4.19995 4.7002 5.5431 4.7002 7.19995C4.7002 8.85681 6.04527 10.2 7.70451 10.2Z" />
      <path d="M17.7998 19.8V17.7558C17.7994 16.8499 17.6027 15.9698 17.2407 15.2539C16.8787 14.5379 16.3719 14.0265 15.7998 13.8" />
      <path d="M13.2998 4.20117C13.8712 4.37173 14.3776 4.75913 14.7392 5.30232C15.1009 5.8455 15.2972 6.51356 15.2972 7.20117C15.2972 7.88879 15.1009 8.55685 14.7392 9.10003C14.3776 9.64321 13.8712 10.0306 13.2998 10.2012" />
      <path d="M18.1001 8L22.1001 12" />
      <path d="M22.1001 8L18.1001 12" />
    </g>
  ),
});

export const MapIcon = createIcon({
  displayName: "MapIcon",
  viewBox: "0 0 16 16",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M0.666504 4.00016V14.6668L5.33317 12.0002L10.6665 14.6668L15.3332 12.0002V1.3335L10.6665 4.00016L5.33317 1.3335L0.666504 4.00016Z" />
      <path d="M5.3335 1.3335V12.0002" />
      <path d="M10.6665 4V14.6667" />
    </g>
  ),
});

export const RadioButtonSelected = createIcon({
  displayName: "RadioButtonSelected",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle xmlns="http://www.w3.org/2000/svg" cx="12" cy="12" r="4" />
    </g>
  ),
});

export const CircleCheckIcon = createIcon({
  displayName: "CircleCheckIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </g>
  ),
});

export const ShieldIcon = createIcon({
  displayName: "ShieldIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
    </g>
  ),
});
