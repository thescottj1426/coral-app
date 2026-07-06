'use client';

import { useState, useTransition } from 'react';
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { followUser, unfollowUser } from '@/app/actions/users';

interface Props {
  targetUserId: string;
  initialFollowing: boolean;
}

export function FollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        if (following) {
          await unfollowUser(targetUserId);
          setFollowing(false);
        } else {
          await followUser(targetUserId);
          setFollowing(true);
        }
      } catch {
        notifications.show({ message: 'Something went wrong', color: 'red' });
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={following ? 'default' : 'filled'}
      loading={isPending}
      onClick={toggle}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
