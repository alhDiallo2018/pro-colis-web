import { useState, useRef, useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'

export interface Country {
  code: string
  dialCode: string
  name: string
  flag: string
}

// eslint-disable-next-line react-refresh/only-export-components
export const ALL_COUNTRIES: Country[] = [
  { code: 'AF', dialCode: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', dialCode: '+355', name: 'Albanie', flag: '🇦🇱' },
  { code: 'DZ', dialCode: '+213', name: 'Algérie', flag: '🇩🇿' },
  { code: 'AD', dialCode: '+376', name: 'Andorre', flag: '🇦🇩' },
  { code: 'AO', dialCode: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: 'AG', dialCode: '+1', name: 'Antigua-et-Barbuda', flag: '🇦🇬' },
  { code: 'AR', dialCode: '+54', name: 'Argentine', flag: '🇦🇷' },
  { code: 'AM', dialCode: '+374', name: 'Arménie', flag: '🇦🇲' },
  { code: 'AU', dialCode: '+61', name: 'Australie', flag: '🇦🇺' },
  { code: 'AT', dialCode: '+43', name: 'Autriche', flag: '🇦🇹' },
  { code: 'AZ', dialCode: '+994', name: 'Azerbaïdjan', flag: '🇦🇿' },
  { code: 'BS', dialCode: '+1', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', dialCode: '+973', name: 'Bahreïn', flag: '🇧🇭' },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', dialCode: '+1', name: 'Barbade', flag: '🇧🇧' },
  { code: 'BY', dialCode: '+375', name: 'Biélorussie', flag: '🇧🇾' },
  { code: 'BE', dialCode: '+32', name: 'Belgique', flag: '🇧🇪' },
  { code: 'BZ', dialCode: '+501', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', dialCode: '+229', name: 'Bénin', flag: '🇧🇯' },
  { code: 'BT', dialCode: '+975', name: 'Bhoutan', flag: '🇧🇹' },
  { code: 'BO', dialCode: '+591', name: 'Bolivie', flag: '🇧🇴' },
  { code: 'BA', dialCode: '+387', name: 'Bosnie-Herzégovine', flag: '🇧🇦' },
  { code: 'BW', dialCode: '+267', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', dialCode: '+55', name: 'Brésil', flag: '🇧🇷' },
  { code: 'BN', dialCode: '+673', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', dialCode: '+359', name: 'Bulgarie', flag: '🇧🇬' },
  { code: 'BF', dialCode: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', dialCode: '+257', name: 'Burundi', flag: '🇧🇮' },
  { code: 'CV', dialCode: '+238', name: 'Cap-Vert', flag: '🇨🇻' },
  { code: 'KH', dialCode: '+855', name: 'Cambodge', flag: '🇰🇭' },
  { code: 'CM', dialCode: '+237', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'CF', dialCode: '+236', name: 'Centrafrique', flag: '🇨🇫' },
  { code: 'TD', dialCode: '+235', name: 'Tchad', flag: '🇹🇩' },
  { code: 'CL', dialCode: '+56', name: 'Chili', flag: '🇨🇱' },
  { code: 'CN', dialCode: '+86', name: 'Chine', flag: '🇨🇳' },
  { code: 'CO', dialCode: '+57', name: 'Colombie', flag: '🇨🇴' },
  { code: 'KM', dialCode: '+269', name: 'Comores', flag: '🇰🇲' },
  { code: 'CG', dialCode: '+242', name: 'Congo-Brazzaville', flag: '🇨🇬' },
  { code: 'CD', dialCode: '+243', name: 'Congo-Kinshasa', flag: '🇨🇩' },
  { code: 'CR', dialCode: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CI', dialCode: '+225', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'HR', dialCode: '+385', name: 'Croatie', flag: '🇭🇷' },
  { code: 'CU', dialCode: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', dialCode: '+357', name: 'Chypre', flag: '🇨🇾' },
  { code: 'CZ', dialCode: '+420', name: 'Tchéquie', flag: '🇨🇿' },
  { code: 'DK', dialCode: '+45', name: 'Danemark', flag: '🇩🇰' },
  { code: 'DJ', dialCode: '+253', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', dialCode: '+1', name: 'Dominique', flag: '🇩🇲' },
  { code: 'DO', dialCode: '+1', name: 'République dominicaine', flag: '🇩🇴' },
  { code: 'EC', dialCode: '+593', name: 'Équateur', flag: '🇪🇨' },
  { code: 'EG', dialCode: '+20', name: 'Égypte', flag: '🇪🇬' },
  { code: 'SV', dialCode: '+503', name: 'Salvador', flag: '🇸🇻' },
  { code: 'GQ', dialCode: '+240', name: 'Guinée équatoriale', flag: '🇬🇶' },
  { code: 'ER', dialCode: '+291', name: 'Érythrée', flag: '🇪🇷' },
  { code: 'EE', dialCode: '+372', name: 'Estonie', flag: '🇪🇪' },
  { code: 'SZ', dialCode: '+268', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'ET', dialCode: '+251', name: 'Éthiopie', flag: '🇪🇹' },
  { code: 'FJ', dialCode: '+679', name: 'Fidji', flag: '🇫🇯' },
  { code: 'FI', dialCode: '+358', name: 'Finlande', flag: '🇫🇮' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'GA', dialCode: '+241', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', dialCode: '+220', name: 'Gambie', flag: '🇬🇲' },
  { code: 'GE', dialCode: '+995', name: 'Géorgie', flag: '🇬🇪' },
  { code: 'DE', dialCode: '+49', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'GH', dialCode: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', dialCode: '+30', name: 'Grèce', flag: '🇬🇷' },
  { code: 'GD', dialCode: '+1', name: 'Grenade', flag: '🇬🇩' },
  { code: 'GT', dialCode: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', dialCode: '+224', name: 'Guinée', flag: '🇬🇳' },
  { code: 'GW', dialCode: '+245', name: 'Guinée-Bissau', flag: '🇬🇼' },
  { code: 'GY', dialCode: '+592', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', dialCode: '+509', name: 'Haïti', flag: '🇭🇹' },
  { code: 'HN', dialCode: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HU', dialCode: '+36', name: 'Hongrie', flag: '🇭🇺' },
  { code: 'IS', dialCode: '+354', name: 'Islande', flag: '🇮🇸' },
  { code: 'IN', dialCode: '+91', name: 'Inde', flag: '🇮🇳' },
  { code: 'ID', dialCode: '+62', name: 'Indonésie', flag: '🇮🇩' },
  { code: 'IR', dialCode: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', dialCode: '+964', name: 'Irak', flag: '🇮🇶' },
  { code: 'IE', dialCode: '+353', name: 'Irlande', flag: '🇮🇪' },
  { code: 'IL', dialCode: '+972', name: 'Israël', flag: '🇮🇱' },
  { code: 'IT', dialCode: '+39', name: 'Italie', flag: '🇮🇹' },
  { code: 'JM', dialCode: '+1', name: 'Jamaïque', flag: '🇯🇲' },
  { code: 'JP', dialCode: '+81', name: 'Japon', flag: '🇯🇵' },
  { code: 'JO', dialCode: '+962', name: 'Jordanie', flag: '🇯🇴' },
  { code: 'KZ', dialCode: '+7', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', dialCode: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', dialCode: '+686', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KP', dialCode: '+850', name: 'Corée du Nord', flag: '🇰🇵' },
  { code: 'KR', dialCode: '+82', name: 'Corée du Sud', flag: '🇰🇷' },
  { code: 'KW', dialCode: '+965', name: 'Koweït', flag: '🇰🇼' },
  { code: 'KG', dialCode: '+996', name: 'Kirghizistan', flag: '🇰🇬' },
  { code: 'LA', dialCode: '+856', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', dialCode: '+371', name: 'Lettonie', flag: '🇱🇻' },
  { code: 'LB', dialCode: '+961', name: 'Liban', flag: '🇱🇧' },
  { code: 'LS', dialCode: '+266', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', dialCode: '+231', name: 'Libéria', flag: '🇱🇷' },
  { code: 'LY', dialCode: '+218', name: 'Libye', flag: '🇱🇾' },
  { code: 'LI', dialCode: '+423', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', dialCode: '+370', name: 'Lituanie', flag: '🇱🇹' },
  { code: 'LU', dialCode: '+352', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MG', dialCode: '+261', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', dialCode: '+265', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', dialCode: '+60', name: 'Malaisie', flag: '🇲🇾' },
  { code: 'MV', dialCode: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', dialCode: '+223', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', dialCode: '+356', name: 'Malte', flag: '🇲🇹' },
  { code: 'MH', dialCode: '+692', name: 'Îles Marshall', flag: '🇲🇭' },
  { code: 'MR', dialCode: '+222', name: 'Mauritanie', flag: '🇲🇷' },
  { code: 'MU', dialCode: '+230', name: 'Maurice', flag: '🇲🇺' },
  { code: 'MX', dialCode: '+52', name: 'Mexique', flag: '🇲🇽' },
  { code: 'FM', dialCode: '+691', name: 'Micronésie', flag: '🇫🇲' },
  { code: 'MD', dialCode: '+373', name: 'Moldavie', flag: '🇲🇩' },
  { code: 'MC', dialCode: '+377', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', dialCode: '+976', name: 'Mongolie', flag: '🇲🇳' },
  { code: 'ME', dialCode: '+382', name: 'Monténégro', flag: '🇲🇪' },
  { code: 'MA', dialCode: '+212', name: 'Maroc', flag: '🇲🇦' },
  { code: 'MZ', dialCode: '+258', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', dialCode: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', dialCode: '+264', name: 'Namibie', flag: '🇳🇦' },
  { code: 'NR', dialCode: '+674', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', dialCode: '+977', name: 'Népal', flag: '🇳🇵' },
  { code: 'NL', dialCode: '+31', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'NZ', dialCode: '+64', name: 'Nouvelle-Zélande', flag: '🇳🇿' },
  { code: 'NI', dialCode: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', dialCode: '+227', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', dialCode: '+234', name: 'Nigéria', flag: '🇳🇬' },
  { code: 'MK', dialCode: '+389', name: 'Macédoine du Nord', flag: '🇲🇰' },
  { code: 'NO', dialCode: '+47', name: 'Norvège', flag: '🇳🇴' },
  { code: 'OM', dialCode: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', dialCode: '+680', name: 'Palaos', flag: '🇵🇼' },
  { code: 'PA', dialCode: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', dialCode: '+675', name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬' },
  { code: 'PY', dialCode: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', dialCode: '+51', name: 'Pérou', flag: '🇵🇪' },
  { code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', dialCode: '+48', name: 'Pologne', flag: '🇵🇱' },
  { code: 'PT', dialCode: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', dialCode: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', dialCode: '+40', name: 'Roumanie', flag: '🇷🇴' },
  { code: 'RU', dialCode: '+7', name: 'Russie', flag: '🇷🇺' },
  { code: 'RW', dialCode: '+250', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', dialCode: '+1', name: 'Saint-Kitts-et-Nevis', flag: '🇰🇳' },
  { code: 'LC', dialCode: '+1', name: 'Sainte-Lucie', flag: '🇱🇨' },
  { code: 'VC', dialCode: '+1', name: 'Saint-Vincent-et-les-Grenadines', flag: '🇻🇨' },
  { code: 'WS', dialCode: '+685', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', dialCode: '+378', name: 'Saint-Marin', flag: '🇸🇲' },
  { code: 'ST', dialCode: '+239', name: 'Sao Tomé-et-Principe', flag: '🇸🇹' },
  { code: 'SA', dialCode: '+966', name: 'Arabie saoudite', flag: '🇸🇦' },
  { code: 'SN', dialCode: '+221', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'RS', dialCode: '+381', name: 'Serbie', flag: '🇷🇸' },
  { code: 'SC', dialCode: '+248', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', dialCode: '+232', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', dialCode: '+65', name: 'Singapour', flag: '🇸🇬' },
  { code: 'SK', dialCode: '+421', name: 'Slovaquie', flag: '🇸🇰' },
  { code: 'SI', dialCode: '+386', name: 'Slovénie', flag: '🇸🇮' },
  { code: 'SB', dialCode: '+677', name: 'Îles Salomon', flag: '🇸🇧' },
  { code: 'SO', dialCode: '+252', name: 'Somalie', flag: '🇸🇴' },
  { code: 'ZA', dialCode: '+27', name: 'Afrique du Sud', flag: '🇿🇦' },
  { code: 'SS', dialCode: '+211', name: 'Soudan du Sud', flag: '🇸🇸' },
  { code: 'ES', dialCode: '+34', name: 'Espagne', flag: '🇪🇸' },
  { code: 'LK', dialCode: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', dialCode: '+249', name: 'Soudan', flag: '🇸🇩' },
  { code: 'SR', dialCode: '+597', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SE', dialCode: '+46', name: 'Suède', flag: '🇸🇪' },
  { code: 'CH', dialCode: '+41', name: 'Suisse', flag: '🇨🇭' },
  { code: 'SY', dialCode: '+963', name: 'Syrie', flag: '🇸🇾' },
  { code: 'TJ', dialCode: '+992', name: 'Tadjikistan', flag: '🇹🇯' },
  { code: 'TZ', dialCode: '+255', name: 'Tanzanie', flag: '🇹🇿' },
  { code: 'TH', dialCode: '+66', name: 'Thaïlande', flag: '🇹🇭' },
  { code: 'TL', dialCode: '+670', name: 'Timor oriental', flag: '🇹🇱' },
  { code: 'TG', dialCode: '+228', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', dialCode: '+676', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', dialCode: '+1', name: 'Trinité-et-Tobago', flag: '🇹🇹' },
  { code: 'TN', dialCode: '+216', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'TR', dialCode: '+90', name: 'Turquie', flag: '🇹🇷' },
  { code: 'TM', dialCode: '+993', name: 'Turkménistan', flag: '🇹🇲' },
  { code: 'TV', dialCode: '+688', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UG', dialCode: '+256', name: 'Ouganda', flag: '🇺🇬' },
  { code: 'UA', dialCode: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', dialCode: '+971', name: 'Émirats arabes unis', flag: '🇦🇪' },
  { code: 'GB', dialCode: '+44', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'US', dialCode: '+1', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'UY', dialCode: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', dialCode: '+998', name: 'Ouzbékistan', flag: '🇺🇿' },
  { code: 'VU', dialCode: '+678', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VA', dialCode: '+379', name: 'Vatican', flag: '🇻🇦' },
  { code: 'VE', dialCode: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', dialCode: '+84', name: 'Viêt Nam', flag: '🇻🇳' },
  { code: 'YE', dialCode: '+967', name: 'Yémen', flag: '🇾🇪' },
  { code: 'ZM', dialCode: '+260', name: 'Zambie', flag: '🇿🇲' },
  { code: 'ZW', dialCode: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'PS', dialCode: '+970', name: 'Palestine', flag: '🇵🇸' },
  { code: 'XK', dialCode: '+383', name: 'Kosovo', flag: '🇽🇰' },
  { code: 'NC', dialCode: '+687', name: 'Nouvelle-Calédonie', flag: '🇳🇨' },
  { code: 'PF', dialCode: '+689', name: 'Polynésie française', flag: '🇵🇫' },
  { code: 'GF', dialCode: '+594', name: 'Guyane française', flag: '🇬🇫' },
  { code: 'GP', dialCode: '+590', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', dialCode: '+596', name: 'Martinique', flag: '🇲🇶' },
  { code: 'YT', dialCode: '+262', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'RE', dialCode: '+262', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'CK', dialCode: '+682', name: 'Îles Cook', flag: '🇨🇰' },
  { code: 'AW', dialCode: '+297', name: 'Aruba', flag: '🇦🇼' },
  { code: 'FO', dialCode: '+298', name: 'Îles Féroé', flag: '🇫🇴' },
  { code: 'GL', dialCode: '+299', name: 'Groenland', flag: '🇬🇱' },
  { code: 'HK', dialCode: '+852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'MO', dialCode: '+853', name: 'Macao', flag: '🇲🇴' },
  { code: 'PR', dialCode: '+1', name: 'Porto Rico', flag: '🇵🇷' },
  { code: 'BQ', dialCode: '+599', name: 'Pays-Bas caribéens', flag: '🇧🇶' },
  { code: 'CW', dialCode: '+599', name: 'Curaçao', flag: '🇨🇼' },
  { code: 'SX', dialCode: '+1', name: 'Saint-Martin', flag: '🇸🇽' },
  { code: 'AS', dialCode: '+1', name: 'Samoa américaines', flag: '🇦🇸' },
  { code: 'GU', dialCode: '+1', name: 'Guam', flag: '🇬🇺' },
  { code: 'MP', dialCode: '+1', name: 'Îles Mariannes du Nord', flag: '🇲🇵' },
  { code: 'VI', dialCode: '+1', name: 'Îles Vierges américaines', flag: '🇻🇮' },
  { code: 'BM', dialCode: '+1', name: 'Bermudes', flag: '🇧🇲' },
  { code: 'KY', dialCode: '+1', name: 'Îles Caïmans', flag: '🇰🇾' },
  { code: 'TC', dialCode: '+1', name: 'Îles Turques-et-Caïques', flag: '🇹🇨' },
  { code: 'AI', dialCode: '+1', name: 'Anguilla', flag: '🇦🇮' },
  { code: 'MS', dialCode: '+1', name: 'Montserrat', flag: '🇲🇸' },
  { code: 'VG', dialCode: '+1', name: 'Îles Vierges britanniques', flag: '🇻🇬' },
  { code: 'FK', dialCode: '+500', name: 'Îles Malouines', flag: '🇫🇰' },
  { code: 'GI', dialCode: '+350', name: 'Gibraltar', flag: '🇬🇮' },
  { code: 'SH', dialCode: '+290', name: 'Sainte-Hélène', flag: '🇸🇭' },
  { code: 'PM', dialCode: '+508', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
  { code: 'WF', dialCode: '+681', name: 'Wallis-et-Futuna', flag: '🇼🇫' },
  { code: 'AX', dialCode: '+358', name: 'Îles Åland', flag: '🇦🇽' },
  { code: 'GG', dialCode: '+44', name: 'Guernesey', flag: '🇬🇬' },
  { code: 'JE', dialCode: '+44', name: 'Jersey', flag: '🇯🇪' },
  { code: 'IM', dialCode: '+44', name: 'Île de Man', flag: '🇮🇲' },
  { code: 'IO', dialCode: '+246', name: 'Territoire britannique de l\'océan Indien', flag: '🇮🇴' },
  { code: 'CX', dialCode: '+61', name: 'Île Christmas', flag: '🇨🇽' },
  { code: 'CC', dialCode: '+61', name: 'Îles Cocos', flag: '🇨🇨' },
  { code: 'NF', dialCode: '+672', name: 'Île Norfolk', flag: '🇳🇫' },
  { code: 'NU', dialCode: '+683', name: 'Niue', flag: '🇳🇺' },
  { code: 'TK', dialCode: '+690', name: 'Tokelau', flag: '🇹🇰' },
  { code: 'PN', dialCode: '+64', name: 'Îles Pitcairn', flag: '🇵🇳' },
  { code: 'BL', dialCode: '+590', name: 'Saint-Barthélemy', flag: '🇧🇱' },
  { code: 'MF', dialCode: '+590', name: 'Saint-Martin (FR)', flag: '🇲🇫' },
  { code: 'SJ', dialCode: '+47', name: 'Svalbard et Jan Mayen', flag: '🇸🇯' },
  { code: 'GS', dialCode: '+500', name: 'Géorgie du Sud-et-les Îles Sandwich du Sud', flag: '🇬🇸' },
  { code: 'EH', dialCode: '+212', name: 'Sahara occidental', flag: '🇪🇭' },
  { code: 'TW', dialCode: '+886', name: 'Taïwan', flag: '🇹🇼' },
  { code: 'AQ', dialCode: '+672', name: 'Antarctique', flag: '🇦🇶' },
  { code: 'BV', dialCode: '+47', name: 'Île Bouvet', flag: '🇧🇻' },
  { code: 'HM', dialCode: '+61', name: 'Îles Heard-et-MacDonald', flag: '🇭🇲' },
  { code: 'TF', dialCode: '+262', name: 'Terres australes françaises', flag: '🇹🇫' },
  { code: 'UM', dialCode: '+1', name: 'Îles mineures éloignées des États-Unis', flag: '🇺🇲' },
]

export interface CountryCodePickerProps {
  value?: string
  onChange: (dialCode: string, country: Country) => void
  placeholder?: string
  style?: CSSProperties
}

export function CountryCodePicker({ value, onChange, placeholder = 'Rechercher un pays...', style }: CountryCodePickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const selected = ALL_COUNTRIES.find((c) => c.dialCode === value)

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_COUNTRIES
    const q = query.toLowerCase()
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    )
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setHighlightIdx(-1)
  }, [query])

  const select = (c: Country) => {
    onChange(c.dialCode, c)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true)
        return
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((p) => Math.min(p + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((p) => Math.max(p - 1, 0))
    } else if (e.key === 'Enter' && highlightIdx >= 0 && highlightIdx < filtered.length) {
      e.preventDefault()
      select(filtered[highlightIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth: 110, ...style }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 48,
          padding: '0 10px',
          background: 'var(--surface-card)',
          border: `1px solid ${open ? 'var(--border-focus)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 14,
          color: selected ? 'var(--text-strong)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {selected ? (
          <>
            <span style={{ fontSize: 18 }}>{selected.flag}</span>
            <span>{selected.dialCode}</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-faint)' }}>+...</span>
        )}
        <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--text-muted)' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 200,
            marginTop: 4,
            // Anchored at the left of a phone row, so a fixed 280px panel
            // hangs off the right edge of a small phone.
            width: 'min(280px, calc(100vw - 32px))',
            maxHeight: 360,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '8px 8px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 12px',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--text-muted)' }}>
                search
              </span>
              <input
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--text-strong)',
                }}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((c, i) => (
              <button
                key={c.code}
                type="button"
                onClick={() => select(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 14px',
                  border: 'none',
                  background: i === highlightIdx ? 'var(--surface-sunken)' : selected?.code === c.code ? 'var(--color-primary-soft)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: selected?.code === c.code ? 700 : 500,
                  color: 'var(--text-strong)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={() => setHighlightIdx(i)}
              >
                <span style={{ fontSize: 20, width: 28 }}>{c.flag}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)' }}>
                  {c.dialCode}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
                Aucun pays trouvé.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
