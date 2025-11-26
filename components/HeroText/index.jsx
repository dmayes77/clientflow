"use client";

import { Container, Text, Title } from '@mantine/core';
import { Dots } from '@/components/Dots';
import classes from './HeroText.module.css';

export function HeroText({
  title,
  highlight,
  titleAfterHighlight = "",
  description,
  children,
  maxWidth = 600,
  dotsConfig = [
    { left: 0, top: 0 },
    { left: 60, top: 0 },
    { left: 0, top: 140 },
    { right: 0, top: 60 }
  ]
}) {
  return (
    <Container className={classes.wrapper} size={1400}>
      {dotsConfig.map((config, index) => (
        <Dots key={index} className={classes.dots} style={config} />
      ))}

      <div className={classes.inner}>
        <Title className={classes.title}>
          {title}{' '}
          {highlight && (
            <Text component="span" className={classes.highlight} inherit>
              {highlight}
            </Text>
          )}
          {titleAfterHighlight && ` ${titleAfterHighlight}`}
        </Title>

        {description && (
          <Container p={0} size={maxWidth}>
            <Text size="lg" c="dimmed" className={classes.description}>
              {description}
            </Text>
          </Container>
        )}

        {children && (
          <div className={classes.controls}>
            {children}
          </div>
        )}
      </div>
    </Container>
  );
}
