import React from 'react';
import { Button as AntButton } from 'antd';

/**
 * Bouton unique de l'application.
 * `type="primary"` porte l'aplat de la couleur de marque et du texte blanc
 * (voir `onPrimary` dans src/theme.js).
 */
const Button = ({ children, ...rest }) => <AntButton {...rest}>{children}</AntButton>;

export default Button;
