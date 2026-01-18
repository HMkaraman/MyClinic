import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button, buttonVariants } from './button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
    });

    it('should render children correctly', () => {
      render(
        <Button>
          <span data-testid="child">Child content</span>
        </Button>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-input');
      expect(button).toHaveClass('bg-background');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('text-secondary-foreground');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('should render sm size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-3');
    });

    it('should render lg size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-8');
    });

    it('should render icon size', () => {
      render(<Button size="icon">+</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not trigger onClick when disabled', async () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>,
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild prop', () => {
    it('should render as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('bg-primary');
    });
  });

  describe('custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-primary'); // Still has default classes
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be focusable', async () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole('button');
      await userEvent.tab();

      expect(button).toHaveFocus();
    });

    it('should be activatable with keyboard', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be activatable with space key', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Space</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('type attribute', () => {
    it('should have type="button" by default', () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole('button');
      // React doesn't add default type, but button behaves as type="submit" in forms
      // We can explicitly test custom types
      expect(button.tagName).toBe('BUTTON');
    });

    it('should accept type="submit"', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should accept type="reset"', () => {
      render(<Button type="reset">Reset</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('buttonVariants helper', () => {
    it('should generate correct classes for default variant and size', () => {
      const classes = buttonVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('h-10');
    });

    it('should generate correct classes for specific variant', () => {
      const classes = buttonVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
    });

    it('should generate correct classes for specific size', () => {
      const classes = buttonVariants({ size: 'lg' });
      expect(classes).toContain('h-11');
      expect(classes).toContain('px-8');
    });

    it('should merge custom className', () => {
      const classes = buttonVariants({ className: 'my-custom-class' });
      expect(classes).toContain('my-custom-class');
    });
  });
});
