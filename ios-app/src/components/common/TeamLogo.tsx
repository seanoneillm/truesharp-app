import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ImageSourcePropType } from 'react-native';
import { getTeamInfo, getTeamLogoUrl, getTeamLogoUrls } from '../../utils/teamMappings';

interface TeamLogoProps {
  teamName: string;
  league?: string;
  size?: number;
  style?: any;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ 
  teamName, 
  league,
  size = 24,
  style 
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  const teamInfo = getTeamInfo(teamName, league);
  const logoUrls = getTeamLogoUrls(teamName, league);
  
  // Reset when props change
  useEffect(() => {
    setCurrentUrlIndex(0);
    setImageError(false);
  }, [teamName, league]);
  
  // If no logo URLs or team info, don't render
  if (!logoUrls.length || !teamInfo) {
    return null;
  }

  const logoStyle = [
    styles.logo,
    {
      width: size,
      height: size,
    },
    style
  ];

  // Handle image load error - try next URL
  const handleImageError = () => {
    if (currentUrlIndex < logoUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      setImageError(true);
    }
  };

  // If all images failed, don't render
  if (imageError) {
    return null;
  }

  const currentLogoUrl = logoUrls[currentUrlIndex];

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: currentLogoUrl } as ImageSourcePropType}
        style={logoStyle}
        onError={handleImageError}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 2,
  },
});